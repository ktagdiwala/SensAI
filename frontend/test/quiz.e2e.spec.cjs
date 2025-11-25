const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const http = require('http');

const BASE_URL = 'http://localhost:5174';

describe('Student E2E: Signup → Login → Quiz → Submit → Verify', function () {
  this.timeout(120000);

  let driver;
  const timestamp = Date.now();
  const testEmail = `student_${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test Student';
  let testUserId = null;

  before(async () => {
    const options = new chrome.Options();
    options.addArguments('--disable-gpu', '--no-sandbox');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async () => {
    // Clean up: delete test user and their attempts from DB
    if (testUserId) {
      try {
        console.log(`Cleaning up test user ${testUserId}...`);
        
        // Delete attempts first (foreign key constraint)
        await new Promise((resolve, reject) => {
          const payload = JSON.stringify({ userId: testUserId });
          const opts = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/test/cleanup-attempts',
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            },
          };
          const req = http.request(opts, (res) => {
            res.on('data', () => {});
            res.on('end', () => resolve());
          });
          req.on('error', reject);
          req.write(payload);
          req.end();
        });

        // Delete user
        await new Promise((resolve, reject) => {
          const payload = JSON.stringify({ userId: testUserId });
          const opts = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/test/cleanup-user',
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            },
          };
          const req = http.request(opts, (res) => {
            res.on('data', () => {});
            res.on('end', () => resolve());
          });
          req.on('error', reject);
          req.write(payload);
          req.end();
        });

        console.log('✓ Test user cleaned up successfully');
      } catch (err) {
        console.error('Failed to clean up test user:', err.message);
      }
    }
    
    if (driver) await driver.quit();
  });

  it('should signup, login, complete quiz, and verify attempt stored', async () => {
    // STEP 1: Open homepage and click Student Sign Up
    await driver.get(`${BASE_URL}/`);
    const signupBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[normalize-space(text())='Student Sign Up']")),
      10000
    );
    await signupBtn.click();

    // Wait for signup modal inputs
    const nameInput = await driver.wait(until.elementLocated(By.id('name')), 10000);
    const emailInput = await driver.findElement(By.id('email'));
    const passwordInput = await driver.findElement(By.id('password'));
    const confirmInput = await driver.findElement(By.id('confirmPassword'));

    // Fill signup form
    await nameInput.sendKeys(testName);
    await emailInput.sendKeys(testEmail);
    await passwordInput.sendKeys(testPassword);
    await confirmInput.sendKeys(testPassword);

    // Click Sign up button in modal
    const signupSubmit = await driver.findElement(By.xpath("//button[normalize-space(text())='Sign up']"));
    await signupSubmit.click();

    // Wait for modal to close
    await driver.wait(async () => {
      const elems = await driver.findElements(By.id('name'));
      return elems.length === 0;
    }, 10000);

    // STEP 2: Click Student Sign in
    const signinBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[normalize-space(text())='Student Sign in']")),
      10000
    );
    await signinBtn.click();

    // Wait for sign in modal and fill credentials
    const loginEmail = await driver.wait(until.elementLocated(By.id('email')), 10000);
    const loginPassword = await driver.findElement(By.id('password'));
    await loginEmail.sendKeys(testEmail);
    await loginPassword.sendKeys(testPassword);

    // Submit sign in
    const loginSubmit = await driver.findElement(By.xpath("//button[normalize-space(text())='Sign in']"));
    await loginSubmit.click();

    // Wait for redirect to /students
    await driver.wait(until.urlContains('/students'), 30000);

    // STEP 3: Enter quiz id and password
    const quizIdInput = await driver.wait(until.elementLocated(By.id('QuizId')), 10000);
    const quizPasswordInput = await driver.findElement(By.id('QuizPassword'));
    await quizIdInput.sendKeys('1');
    await quizPasswordInput.sendKeys('SQL123');

    // Click the Submit button to start the quiz
    await driver.wait(until.elementLocated(By.id('QuizId')), 10000);
    await driver.executeScript(() => {
      const quizEl = document.getElementById('QuizId');
      if (!quizEl) return false;
      const form = quizEl.closest('form');
      if (!form) return false;
      const btn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (!btn) return false;
      btn.click();
      return true;
    });

    // Wait for quiz page to load
    await driver.wait(until.urlContains('/quiz'), 15000);

    // STEP 4: Answer questions (click first radio for each question)
    const numQuestions = await driver.executeScript(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const names = [...new Set(radios.map(r => r.name).filter(Boolean))];
      names.forEach((n) => {
        const r = radios.find(x => x.name === n && !x.disabled);
        if (r) r.click();
      });
      return names.length; // return count of questions
    });
    console.log(`Found and answered ${numQuestions} question(s) in the quiz`);

    // STEP 5: Submit quiz
    const submitQuiz = await driver.findElement(By.xpath("//button[normalize-space(text())='Submit Quiz']"));
    await submitQuiz.click();

    // Handle confirm dialog
    try {
      await driver.wait(until.alertIsPresent(), 5000);
      const confirm = await driver.switchTo().alert();
      await confirm.accept();
    } catch (e) {
      // no confirm appeared
    }

    // Wait for final alert saying 'Quiz submitted.' and accept it
    try {
      await driver.wait(until.alertIsPresent(), 10000);
      const finalAlert = await driver.switchTo().alert();
      const text = await finalAlert.getText();
      await finalAlert.accept();
      if (!/submitted/i.test(text)) {
        throw new Error('Did not see submission confirmation alert');
      }
    } catch (e) {
      // If no alert, try to detect page message
      // continue to attempt DB verification
    }

    // Wait for backend to finish recording attempts
    // Verify attempt recorded via /api/attempt/student (retry with longer delays)
    let attemptsResult;
    let found = false;
    for (let retry = 0; retry < 5; retry++) {
      // Wait longer between retries (give backend time to record)
      if (retry > 0) await driver.sleep(2000);
      
      attemptsResult = await driver.executeAsyncScript(function(done) {
        fetch('http://localhost:3000/api/attempt/student', { credentials: 'include' })
          .then(res => res.json())
          .then(data => done({ ok: true, data }))
          .catch(err => done({ ok: false, error: String(err) }));
      });

      if (attemptsResult && attemptsResult.ok) {
        const attempts = attemptsResult.data?.attempts ?? [];
        const quiz1Attempts = attempts.filter(a => String(a.quizId) === '1' || String(a.quiz_id) === '1');
        console.log(`Retry ${retry + 1}: Found ${attempts.length} total attempts (${quiz1Attempts.length} for quizId=1)`);
        if (quiz1Attempts.length >= numQuestions) {
          console.log(`✓ Quiz submitted successfully - ${quiz1Attempts.length} attempt(s) recorded (expected ${numQuestions})`);
          // Store userId from first attempt for cleanup
          if (quiz1Attempts.length > 0) {
            testUserId = quiz1Attempts[0].userId || quiz1Attempts[0].user_id;
          }
          found = true;
          break;
        }
      } else {
        console.log(`Retry ${retry + 1}: API call failed`, attemptsResult);
      }
    }

    if (!found) {
      console.error('Final attempts result:', JSON.stringify(attemptsResult, null, 2));
      throw new Error(`Expected ${numQuestions} attempts for quizId=1, but verification failed after 5 retries`);
    }
  });
});
