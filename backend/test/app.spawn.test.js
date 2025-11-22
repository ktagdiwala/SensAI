const request = require('supertest');
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const SERVER_START_TIMEOUT = process.env.SERVER_START_TIMEOUT
  ? parseInt(process.env.SERVER_START_TIMEOUT, 10)
  : 3500;

const appPath = path.resolve(__dirname, '..', 'app.js');
const baseUrl = `http://localhost:${process.env.PORT || 3001}`;
let serverProc = null;

// Start the server as a separate process
beforeAll((done) => {
  serverProc = spawn(process.execPath, [appPath], {
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  setTimeout(done, SERVER_START_TIMEOUT); // wait for server startup
});

// Stop the server after tests
afterAll(() => {
  if (serverProc) serverProc.kill();
});

describe('Spawned server endpoints (no app.js change)', () => {

  // Test that the root endpoint responds successfully
  test('GET / responds 200', async () => {
    const res = await request(baseUrl).get('/');
    expect([200, 204]).toContain(res.status);
  });

  // Test that /dbTest returns 200 when the database is available
  test('GET /dbTest responds 200', async () => {
    const res = await request(baseUrl).get('/dbTest');
    expect(res.status).toBe(200);
  });
});
