import crypto from 'crypto';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key!!';
const ALGORITHM = 'aes-256-gcm';

export class EncryptionService {
  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  static encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV + AuthTag + Encrypted data
      const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
      return combined;
    } catch (error) {
      throw new Error(`Encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Decrypt data encrypted with encrypt()
   */
  static decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create a hash for key lookup without exposing the key
   */
  static createKeyHash(key: string): string {
    return crypto
      .createHash('sha256')
      .update(key + ENCRYPTION_KEY)
      .digest('hex');
  }

  /**
   * Generate a secure random key
   */
  static generateRandomKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt using CryptoJS (alternative method)
   */
  static encryptWithCryptoJS(text: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      throw new Error(`CryptoJS encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Decrypt using CryptoJS
   */
  static decryptWithCryptoJS(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Failed to decrypt data');
      }
      
      return decrypted;
    } catch (error) {
      throw new Error(`CryptoJS decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate key format and strength
   */
  static validateKeyFormat(key: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!key || key.length === 0) {
      issues.push('Key cannot be empty');
    }

    if (key.length < 8) {
      issues.push('Key should be at least 8 characters long');
    }

    if (key.includes(' ')) {
      issues.push('Key should not contain spaces');
    }

    // Check for common patterns
    const patterns = [
      { regex: /^sk_test_/, name: 'Stripe test key' },
      { regex: /^sk_live_/, name: 'Stripe live key' },
      { regex: /^pk_test_/, name: 'Stripe publishable test key' },
      { regex: /^pk_live_/, name: 'Stripe publishable live key' },
      { regex: /^AIza/, name: 'Google API key' },
      { regex: /^ya29\./, name: 'Google OAuth token' },
      { regex: /^ghp_/, name: 'GitHub personal access token' },
      { regex: /^xoxb-/, name: 'Slack bot token' },
      { regex: /^xoxp-/, name: 'Slack user token' }
    ];

    return {
      valid: issues.length === 0,
      issues
    };
  }
}
