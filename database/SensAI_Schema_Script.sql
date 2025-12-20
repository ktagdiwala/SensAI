-- -----------------------------------------------------
-- Schema sensai
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `sensai`;
USE `sensai`;

-- -----------------------------------------------------
-- Table `sensai`.`role`
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS `sensai`.`role` (
  `roleId` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`roleId`),
  UNIQUE INDEX `uk_role_name` (`name` ASC));


-- -----------------------------------------------------
-- Table `sensai`.`user`
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS `sensai`.`user` (
  `userId` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `apiKey` VARCHAR(255) NULL DEFAULT NULL,
  `roleId` INT NOT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE INDEX `uk_user_email` (`email` ASC) ,
  INDEX `fk_user_role` (`roleId` ASC),
  CONSTRAINT `fk_user_role`
    FOREIGN KEY (`roleId`)
    REFERENCES `sensai`.`role` (`roleId`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT);


-- -----------------------------------------------------
-- Table `sensai`.`course`
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS `sensai`.`course` (
  `courseId` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`courseId`),
  UNIQUE INDEX `uk_course_title` (`title` ASC) );


-- -----------------------------------------------------
-- Table `sensai`.`quiz`
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS `sensai`.`quiz` (
  `quizId` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL,
  `accessCode` VARCHAR(45) NOT NULL,
  `prompt` TEXT NULL DEFAULT NULL,
  `courseId` INT NOT NULL,
  PRIMARY KEY (`quizId`),
  UNIQUE INDEX `uk_quiz_accessCode` (`accessCode` ASC) ,
  INDEX `fk_quiz_course` (`courseId` ASC),
  CONSTRAINT `fk_quiz_course`
    FOREIGN KEY (`courseId`)
    REFERENCES `sensai`.`course` (`courseId`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT);


-- -----------------------------------------------------
-- Table `sensai`.`question`
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS `sensai`.`question` (
  `questionId` INT NOT NULL AUTO_INCREMENT,
  `title` TEXT NOT NULL,
  `correctAns` TEXT NOT NULL,
  `otherAns` TEXT NULL,
  `prompt` TEXT NULL DEFAULT NULL,
  `courseId` INT NOT NULL,
  PRIMARY KEY (`questionId`),
  INDEX `fk_question_course` (`courseId` ASC) ,
  CONSTRAINT `fk_question_course`
    FOREIGN KEY (`courseId`)
    REFERENCES `sensai`.`course` (`courseId`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT);


-- -----------------------------------------------------
-- Table `sensai`.`chat_history`
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS `sensai`.`chat_history` (
  `userId` INT NOT NULL,
  `quizId` INT NOT NULL,
  `questionId` INT NOT NULL,
  `chat` TEXT NULL,
  `lastSaved` DATETIME NOT NULL,
  PRIMARY KEY (`userId`, `quizId`, `questionId`),
  INDEX `fk_chat_history_quiz1_idx` (`quizId` ASC) ,
  INDEX `fk_chat_history_question1_idx` (`questionId` ASC) ,
  CONSTRAINT `fk_chat_history_user`
    FOREIGN KEY (`userId`)
    REFERENCES `sensai`.`user` (`userId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_chat_history_quiz1`
    FOREIGN KEY (`quizId`)
    REFERENCES `sensai`.`quiz` (`quizId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_chat_history_question1`
    FOREIGN KEY (`questionId`)
    REFERENCES `sensai`.`question` (`questionId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);


-- -----------------------------------------------------
-- Table `sensai`.`mistake_type`
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS `sensai`.`mistake_type` (
  `mistakeId` INT NOT NULL,
  `label` VARCHAR(45) NOT NULL,
  `description` VARCHAR(125) NOT NULL,
  PRIMARY KEY (`mistakeId`));

USE `sensai` ;

-- -----------------------------------------------------
-- Table `sensai`.`question_attempt`
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS `sensai`.`question_attempt` (
  `userId` INT NOT NULL,
  `quizId` INT NOT NULL,
  `questionId` INT NOT NULL,
  `dateTime` DATETIME NOT NULL,
  `isCorrect` TINYINT NOT NULL DEFAULT '0',
  `givenAns` TEXT NULL,
  `numMsgs` INT NULL DEFAULT NULL,
  `mistakeId` INT NULL,
  `selfConfidence` TINYINT NULL,
  PRIMARY KEY (`userId`, `quizId`, `questionId`, `dateTime`),
  CONSTRAINT `chk_attempt_isCorrect` CHECK (`isCorrect` IN (0,1)),
  INDEX `fk_attempt_user` (`userId` ASC) ,
  INDEX `fk_attempt_quiz` (`quizId` ASC) ,
  INDEX `fk_attempt_question` (`questionId` ASC) ,
  INDEX `fk_question_attempt_mistake_type1_idx` (`mistakeId` ASC) ,
  CONSTRAINT `fk_attempt_question`
    FOREIGN KEY (`questionId`)
    REFERENCES `sensai`.`question` (`questionId`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_attempt_quiz`
    FOREIGN KEY (`quizId`)
    REFERENCES `sensai`.`quiz` (`quizId`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_attempt_user`
    FOREIGN KEY (`userId`)
    REFERENCES `sensai`.`user` (`userId`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_question_attempt_mistake_type1`
    FOREIGN KEY (`mistakeId`)
    REFERENCES `sensai`.`mistake_type` (`mistakeId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);


-- -----------------------------------------------------
-- Table `sensai`.`quiz_questions`
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS `sensai`.`quiz_questions` (
  `quizId` INT NOT NULL,
  `questionId` INT NOT NULL,
  PRIMARY KEY (`quizId`, `questionId`),
  INDEX `fk_qq_question` (`questionId` ASC) ,
  CONSTRAINT `fk_qq_question`
    FOREIGN KEY (`questionId`)
    REFERENCES `sensai`.`question` (`questionId`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_qq_quiz`
    FOREIGN KEY (`quizId`)
    REFERENCES `sensai`.`quiz` (`quizId`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT);


-- -----------------------------------------------------
-- Table `sensai`.`session`
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS `sensai`.`session` (
  `sessionId` CHAR(64) NOT NULL,
  `userId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 1 DAY),
  PRIMARY KEY (`sessionId`),
  INDEX `fk_sessions_user` (`userId` ASC),
  CONSTRAINT `fk_sessions_user`
    FOREIGN KEY (`userId`)
    REFERENCES `sensai`.`user` (`userId`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT);
    
CREATE EVENT IF NOT EXISTS delete_expired_sessions
ON SCHEDULE EVERY 1 HOUR
DO
    DELETE FROM session WHERE expiresAt < NOW();