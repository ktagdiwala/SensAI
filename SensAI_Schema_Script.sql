CREATE DATABASE IF NOT EXISTS sensai;
USE sensai;

CREATE TABLE IF NOT EXISTS role (
  roleId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(45) NOT NULL,
  UNIQUE KEY uk_role_name (name)
);

CREATE TABLE IF NOT EXISTS user (
  userId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  apiKey VARCHAR(255),
  roleId INT NOT NULL,
  UNIQUE KEY uk_user_email (email),
  CONSTRAINT fk_user_role
    FOREIGN KEY (roleId) REFERENCES role(roleId)
    ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS course (
  courseId INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  UNIQUE KEY uk_course_title (title)
);

CREATE TABLE IF NOT EXISTS quiz (
  quizId INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  accessCode VARCHAR(45) NOT NULL,
  prompt TEXT,
  courseId INT NOT NULL,
  UNIQUE KEY uk_quiz_accessCode (accessCode),
  CONSTRAINT fk_quiz_course
    FOREIGN KEY (courseId) REFERENCES course(courseId)
    ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question (
  questionId INT AUTO_INCREMENT PRIMARY KEY,
  title TEXT NOT NULL,
  correctAns VARCHAR(100) NOT NULL,  
  otherAns TEXT NOT NULL,
  prompt TEXT,
  courseId INT NOT NULL,
  CONSTRAINT fk_question_course
    FOREIGN KEY (courseId) REFERENCES course(courseId)
    ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  quizId INT NOT NULL,
  questionId INT NOT NULL,
  PRIMARY KEY (quizId, questionId),
  CONSTRAINT fk_qq_quiz
    FOREIGN KEY (quizId) REFERENCES quiz(quizId)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_qq_question
    FOREIGN KEY (questionId) REFERENCES question(questionId)
    ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_attempt (
  dateTime DATETIME NOT NULL,
  userId INT NOT NULL,
  quizId INT NOT NULL,
  questionId INT NOT NULL,
  isCorrect TINYINT NOT NULL DEFAULT 0,
  numMsgs INT,
  PRIMARY KEY (dateTime, userId, quizId, questionId),
  CONSTRAINT chk_attempt_isCorrect CHECK (isCorrect IN (0,1)),
  CONSTRAINT fk_attempt_user
    FOREIGN KEY (userId) REFERENCES user(userId)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_attempt_quiz
    FOREIGN KEY (quizId) REFERENCES quiz(quizId)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_attempt_question
    FOREIGN KEY (questionId) REFERENCES question(questionId)
    ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session (
  sessionId CHAR(64) PRIMARY KEY,
  userId INT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 1 DAY),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (userId) REFERENCES user(userId)
    ON UPDATE RESTRICT ON DELETE CASCADE
);

CREATE EVENT IF NOT EXISTS delete_expired_sessions
ON SCHEDULE EVERY 1 HOUR
DO
  DELETE FROM session WHERE expiresAt < NOW();
