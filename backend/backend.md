# Backend Setup
`npm install` in the `backend` directory to install dependencies.

Run `node app.js` to start the backend server.

Ensure the `.env` file is configured:
- With the correct database credentials (DB_HOST, DB_USER, DB_PASS, PORT).
- With SALT_ROUNDS for password hashing.
- It should be in the backend folder and added to `.gitignore` to prevent sensitive information from being committed.