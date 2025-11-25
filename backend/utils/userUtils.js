const { pool } = require('../config/dbConnection');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

// Validate encryption key exists and is the correct length (32 bytes for AES-256)
// You can generate an encroption key using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
if (!ENCRYPTION_KEY) {
	throw new Error("ENCRYPTION_KEY environment variable is not set.");
}

if (ENCRYPTION_KEY.length !== 64) {
	throw new Error('ENCRYPTION_KEY must be 64 characters (32 bytes in hex format)');
}

/** hashPassword
* Hashes a plaintext password for secure storage.
* @param {string} plaintextPassword - The password to hash.
* @returns {Promise<string>} The resulting password hash.
*/
async function hashPassword(plaintextPassword) {
	const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10; // Standard cost factor (higher is slower, more secure)
	return await bcrypt.hash(plaintextPassword, saltRounds);
}

/** encryptApiKey
 * Encrypts a plaintext API key using AES-256-GCM encryption for secure storage.
 * @param {string} plaintextApiKey - The plaintext API key to encrypt
 * @returns {string} - The encrypted API key with IV and auth tag (format: iv:encryptedData:authTag)
 */
function encryptApiKey(plaintextApiKey) {
	try {
		const iv = crypto.randomBytes(16); // 128-bit IV
		const encryptionKeyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
		
		const cipher = crypto.createCipheriv(ALGORITHM, encryptionKeyBuffer, iv);
		let encrypted = cipher.update(plaintextApiKey, 'utf8', 'hex');
		encrypted += cipher.final('hex');
		
		const authTag = cipher.getAuthTag();
		
		// Format: iv:encryptedData:authTag (all in hex)
		return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
	} catch (error) {
		console.error("Error encrypting API key:", error);
		throw error;
	}
}

/** decryptApiKey
 * Decrypts an encrypted API key using AES-256-GCM.
 * @param {string} encryptedData - The encrypted API key (format: iv:encryptedData:authTag)
 * @returns {string} - The decrypted plaintext API key
 */
function decryptApiKey(encryptedData) {
	try {
		const [ivHex, encrypted, authTagHex] = encryptedData.split(':');
		
		if (!ivHex || !encrypted || !authTagHex) {
			throw new Error('Invalid encrypted data format');
		}
		
		const iv = Buffer.from(ivHex, 'hex');
		const authTag = Buffer.from(authTagHex, 'hex');
		const encryptionKeyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
		
		const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKeyBuffer, iv);
		decipher.setAuthTag(authTag);
		
		let decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		
		return decrypted;
	} catch (error) {
		console.error("Error decrypting API key:", error);
		throw error;
	}
}

/** updateUserApiKey
 * Updates a user's API key in the database.
 * @param {number} userId - The ID of the user
 * @param {string} hashedApiKey - The hashed API key to store
 * @returns {Promise<boolean>} - True if update successful, false otherwise
 */
async function updateUserApiKey(userId, hashedApiKey) {
	const sql = 'UPDATE user SET apiKey = ? WHERE userId = ?';

	try {
		const [result] = await pool.query(sql, [hashedApiKey, userId]);

		// Check if a row was affected
		if (result.affectedRows === 0) {
			console.error("No user found with ID:", userId);
			return false;
		}

		return true;
	} catch (error) {
		console.error("Error updating user API key:", error);
		throw error;
	}
}

/** getUserApiKey
 * Retrieves and decrypts the API key for a user from the database.
 * @param {number} userId - The ID of the user
 * @returns {Promise<string|null>} - The decrypted plaintext API key or null if not found/not set
 */
async function getUserApiKey(userId) {
	const sql = 'SELECT apiKey FROM user WHERE userId = ?';

	try {
		const [result] = await pool.query(sql, [userId]);

		if (result.length === 0) {
			return null;
		}

		const encryptedKey = result[0].apiKey;
		
		// Return null if no API key is set
		if (!encryptedKey) {
			return null;
		}

		// Decrypt and return the plaintext key
		return decryptApiKey(encryptedKey);
	} catch (error) {
		console.error("Error retrieving user API key:", error);
		throw error;
	}
}

/** hasUserApiKey
 * Checks if a user has an API key set without decrypting it.
 * @param {number} userId - The ID of the user
 * @returns {Promise<boolean>} - True if API key is set, false otherwise
 */
async function hasUserApiKey(userId) {
	const sql = 'SELECT apiKey FROM user WHERE userId = ?';

	try {
		const [result] = await pool.query(sql, [userId]);

		if (result.length === 0) {
			return false;
		}

		return result[0].apiKey !== null && result[0].apiKey !== '';
	} catch (error) {
		console.error("Error checking if user has API key:", error);
		throw error;
	}
}

/** clearApiKey
 * Clears a user's API key from the database.
 * @param {number} userId - The ID of the user
 * @returns {Promise<boolean>} - True if update successful, false otherwise
 */
async function clearApiKey(userId) {
	const sql = 'UPDATE user SET apiKey = NULL WHERE userId = ?';

	try {
		const [result] = await pool.query(sql, [userId]);

		if (result.affectedRows === 0) {
			return false;
		}

		return true;
	} catch (error) {
		console.error("Error clearing user API key:", error);
		throw error;
	}
}

/** getUserById
 * Retrieves non-sensitive user information by ID.
 * @param {number} userId - The ID of the user
 * @returns {Promise<object|null>} - User object (without password and apiKey) or null
 */
async function getUserById(userId) {
	const sql = 'SELECT user.name AS name, email, role.name AS roleName FROM user JOIN role ON user.roleId = role.roleId WHERE userId = ?';

	try {
		const [result] = await pool.query(sql, [userId]);

		if (result.length === 0) {
			return null;
		}

		return result[0];
	} catch (error) {
		console.error("Error retrieving user:", error);
		throw error;
	}
}

/** updateUser
 * Updates user information in the database.
 * @param {int} userId 
 * @param {string} name 
 * @param {string} email 
 * @param {string} plaintextPass 
 * @param {string} plaintextApiKey 
 * @returns {boolean|null} - True if update successful, null if user not found or error
 */
async function updateUser(userId, name, email, plaintextPass, plaintextApiKey){
	let encryptedPass = plaintextPass ? await hashPassword(plaintextPass) : undefined;
	let encryptedApiKey = plaintextApiKey ? encryptApiKey(plaintextApiKey) : undefined;
	
	const sql = 'UPDATE user SET name = COALESCE(?, name), email = COALESCE(?, email), password = COALESCE(?, password), apiKey = COALESCE(?, apiKey) WHERE userId = ?';
	try {
		const [result] = await pool.query(sql, [name, email, encryptedPass, encryptedApiKey, userId]);

		if (result.affectedRows === 0) {
			return null;
		}

		return true;
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') {
            throw error;
        }
		console.error("Error updating user:", error);
		throw error;
	}
}

module.exports = {
	hashPassword,
	encryptApiKey,
	decryptApiKey,
	updateUserApiKey,
	getUserApiKey,
	hasUserApiKey,
	clearApiKey,
	getUserById,
	updateUser
};
