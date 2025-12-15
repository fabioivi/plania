import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    console.log('ENCRYPTION_KEY check:', {
      exists: !!key,
      length: key?.length,
      firstChars: key?.substring(0, 5)
    });

    if (!key || key.length !== 32) {
      throw new Error(
        `ENCRYPTION_KEY must be exactly 32 characters for AES-256-GCM. Received length: ${key?.length}`,
      );
    }
    this.encryptionKey = Buffer.from(key, 'utf8');
  }

  /**
   * Encrypt sensitive data (like passwords) using AES-256-GCM
   * Returns encrypted data with IV and authentication tag
   */
  encrypt(plainText: string): EncryptedData {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );

    // Encrypt the data
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt data that was encrypted with encrypt()
   */
  decrypt(encryptedData: EncryptedData): string {
    try {
      // Convert hex strings back to buffers
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );

      // Set authentication tag
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed. Data may be corrupted or tampered.');
    }
  }

  /**
   * Hash a password using bcrypt (for user passwords)
   * Note: This is different from encrypt() - bcrypt is one-way, AES-256-GCM is two-way
   */
  async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a plain text password with a bcrypt hash
   */
  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
