const {validateSession} = require('../utils/sessionUtils')


/** verifySession
 * Verifies that a valid session exists for the incoming request
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
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

// Uses verifySession to confirm user is logged in, additionally checks if user is instructor
async function verifySessionInstructor(req, res, next){
	verifySession(req, res, () => {
		if(req.session.userRole === 'Instructor'){
			next();
		}else{
			return res.status(403).json({message: 'Forbidden: Instructor access required.'});
		}
	});
}

async function verifySessionStudent(req, res, next){
	verifySession(req, res, () => {
		if(req.session.userRole === 'Student'){
			next();
		}else{
			return res.status(403).json({message: 'Forbidden: Student access required.'});
		}
	});
}

module.exports = {verifySession, verifySessionInstructor, verifySessionStudent};