const crypto = require('crypto');

// The algorithm to use
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY || 'default_secret_key_devforge_ai_32';
  // Ensure the key is exactly 32 bytes
  if (key.length >= 32) {
    return Buffer.from(key.substring(0, 32));
  }
  // Pad if too short
  return Buffer.from(key.padEnd(32, '0'));
}

/**
 * Encrypt a text string
 * @param {string} text - The plaintext to encrypt
 * @returns {string} - Combined IV + encrypted text in hex format
 */
function encrypt(text) {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend the IV so we can use it during decryption
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

/**
 * Decrypt an encrypted text string
 * @param {string} encryptedText - Combined IV + encrypted text in hex format
 * @returns {string} - The decrypted plaintext
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  try {
    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedData = Buffer.from(textParts[1], 'hex');
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt
};
