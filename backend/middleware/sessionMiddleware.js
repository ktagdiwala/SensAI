const {validateSession} = require('../utils/sessionUtils')

async function verifySession(req, res, next){
	// Get sessionId from cookies
	const {sessionId} = req.cookies;

	// If sessionId is null, return 401 Unauthorized
	if(!sessionId){
		return res.status(401).json({message: 'Unauthorized: No session ID provided.'});
	}
	// Validate session
	const session = await validateSession(sessionId);

	// If valid, proceed to next middleware/route handler
	if(session){
		req.session = session; // Attach session info to request object
		next();
	}else{
		return res.status(401).json({message: 'Unauthorized: Invalid or expired session.'});
	}
}

module.exports = {verifySession};