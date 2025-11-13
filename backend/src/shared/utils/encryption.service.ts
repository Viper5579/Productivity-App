import crypto from 'crypto';
import { config } from '../../core/config';

/**
 * Service for encrypting and decrypting sensitive data (like Canvas API tokens)
 * Uses AES-256-GCM for encryption
 */
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    // Use encryption key from config (must be 32 characters for AES-256)
    this.key = Buffer.from(config.encryptionKey, 'utf-8');
  }

  /**
   * Encrypt a string
   * Returns base64 encoded string in format: iv:authTag:encryptedData
   */
  encrypt(plainText: string): string {
    // Generate random IV (initialization vector)
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    // Encrypt data
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    const combined = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;

    // Return base64 encoded
    return Buffer.from(combined).toString('base64');
  }

  /**
   * Decrypt an encrypted string
   * Expects base64 encoded string in format: iv:authTag:encryptedData
   */
  decrypt(encryptedText: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedText, 'base64').toString('utf8');

      // Split components
      const [ivHex, authTagHex, encrypted] = combined.split(':');

      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      // Convert from hex
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash a password using bcrypt-compatible method
   * (Note: This is a placeholder - actual password hashing uses bcrypt)
   */
  hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
