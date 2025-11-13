const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv'); // To load variables from .env file

// Load environment variables (Make sure .env file exists)
dotenv.config();

// Import database connection (initializes DB connection)
const { testDatabaseConnection } = require('./config/dbConnection');

// Import routes
const authRoutes = require('./routes/authRoutes');
const registerRoutes = require('./routes/registerRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================
// Global Middleware
// ==================

// CORS Middleware (Allows for connection to the React frontend)
app.use((req, res, next) => {
	// Set headers to allow all origins * (TODO: This will be restricted later in production)
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	if (req.method === 'OPTIONS') {
		res.header('Access-Control-Allow-Methods', 'POST, GET');
		return res.status(200).json({});
	}
	next();
});

// Body Parser Middleware (To parse JSON requests)
app.use(bodyParser.json());

// === Route Mounting ===

// 3. Mount the authRoutes module. All routes in authRoutes.js
// will be prefixed with '/api' (e.g., /api/login)
app.use('/api', authRoutes);
app.use('/api', registerRoutes);

// === Start the Server ===
app.listen(PORT, () => {
	console.log(`Database Service API running on http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
	res.send('This is the SensAI backend.');
})

app.get("/dbTest", async (req, res) => {
	try {
		const rows = await testDatabaseConnection();
		res.send(rows);
	} catch (error) {
		res.status(500).send({ error: error.message });
	}
});//dbTest