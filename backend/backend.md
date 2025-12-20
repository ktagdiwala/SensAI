# Backend Setup Guide

## Installation

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Configuration

Before running the backend, you must create a `.env` file in the `backend` directory with the following variables:

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL database host | `localhost` |
| `DB_USER` | MySQL database username | Your MySQL user |
| `DB_PASS` | MySQL database password | Your MySQL password |
| `PORT` | Backend server port | `3000` |
| `SALT_ROUNDS` | Rounds for bcrypt password hashing | `10` |
| `FRONTEND_URL` | Frontend URL for CORS configuration | `http://localhost:5173` |
| `GEMINI_API_KEY` | Google Gemini API key for the chatbot | Your API key |

### Sample .env File

```
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
PORT=3000
SALT_ROUNDS=10
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
```

**Important**: The `.env` file should be added to `.gitignore` to prevent sensitive information from being committed to version control.

## Getting a Gemini API Key

To enable the SensAI chatbot functionality:

1. Visit [Google AI Studio](https://aistudio.google.com/app/api-keys)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key and paste it into your `.env` file as `GEMINI_API_KEY`

## Running the Backend

Start the backend server by running:

```bash
node app.js
```

The server will start on the port specified in your `.env` file (default: `3000`).

## Notes

- Ensure the database is properly set up before running the backend (see main README.md for database setup instructions)
- The backend must be running before the frontend can successfully communicate with the API
- For local development, `FRONTEND_URL` should be `http://localhost:5173`
- For production deployment, update `FRONTEND_URL` to match your production frontend URL
 