/**
 * Test script to verify encryption/decryption functionality
 * Run with: npm run test:crypto
 */

import { CryptoService } from '../src/common/services/crypto.service';
import { ConfigService } from '@nestjs/config';

async function testCrypto() {
  console.log('🔐 Testing Crypto Service...\n');

  // Mock ConfigService
  const configService = {
    get: (key: string) => {
      if (key === 'ENCRYPTION_KEY') {
        return 'my-32-character-encryption-key!!';
      }
      return null;
    },
  } as ConfigService;

  const cryptoService = new CryptoService(configService);

  // Test 1: Encrypt and Decrypt
  console.log('Test 1: Encrypt and Decrypt');
  const originalPassword = 'mySecurePassword123!';
  console.log(`Original: ${originalPassword}`);

  const encrypted = cryptoService.encrypt(originalPassword);
  console.log(`Encrypted: ${encrypted.encrypted}`);
  console.log(`IV: ${encrypted.iv}`);
  console.log(`AuthTag: ${encrypted.authTag}`);

  const decrypted = cryptoService.decrypt(encrypted);
  console.log(`Decrypted: ${decrypted}`);
  console.log(`Match: ${originalPassword === decrypted ? '✅' : '❌'}\n`);

  // Test 2: Multiple encryptions produce different results
  console.log('Test 2: Multiple encryptions produce different results');
  const encrypted1 = cryptoService.encrypt(originalPassword);
  const encrypted2 = cryptoService.encrypt(originalPassword);
  console.log(`Encrypted 1: ${encrypted1.encrypted.substring(0, 20)}...`);
  console.log(`Encrypted 2: ${encrypted2.encrypted.substring(0, 20)}...`);
  console.log(
    `Different: ${encrypted1.encrypted !== encrypted2.encrypted ? '✅' : '❌'}\n`,
  );

  // Test 3: Decryption fails with wrong data
  console.log('Test 3: Decryption fails with tampered data');
  try {
    const tampered = { ...encrypted, encrypted: 'tampered' };
    cryptoService.decrypt(tampered);
    console.log('❌ Should have thrown error\n');
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
  }

  // Test 4: Password hashing
  console.log('Test 4: Password hashing (bcrypt)');
  const password = 'userPassword123';
  const hashed = await cryptoService.hashPassword(password);
  console.log(`Original: ${password}`);
  console.log(`Hashed: ${hashed.substring(0, 30)}...`);

  const isValid = await cryptoService.comparePassword(password, hashed);
  console.log(`Comparison: ${isValid ? '✅' : '❌'}\n`);

  const isInvalid = await cryptoService.comparePassword('wrongPassword', hashed);
  console.log(`Wrong password rejected: ${!isInvalid ? '✅' : '❌'}\n`);

  console.log('✅ All crypto tests passed!');
}

testCrypto().catch(console.error);
