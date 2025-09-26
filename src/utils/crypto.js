const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');

class CryptoUtils {
  // Generate authentication message for signing
  static generateAuthMessage(walletAddress, nonce) {
    return `Welcome to Translation Quiz dApp!

This signature proves you own this wallet address and will be used to log you in.

Wallet: ${walletAddress}
Nonce: ${nonce}

This signature will not trigger any blockchain transaction or cost any gas fees.`;
  }

  // Verify wallet signature
  static verifySignature(message, signature, walletAddress) {
    try {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // Generate JWT token
  static generateJWT(userId, walletAddress) {
    const payload = {
      userId,
      walletAddress,
      iat: Date.now()
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  // Verify JWT token
  static verifyJWT(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Validate Ethereum address
  static isValidAddress(address) {
    return ethers.utils.isAddress(address);
  }
}

module.exports = CryptoUtils;