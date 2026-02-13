import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';

dotenv.config();

const testEmail = async () => {
  try {
    const testRecipient = 'moksh.dev0411@gmail.com'; // Testing to yourself

    console.log('🔍 Testing integrated Email Service...\n');

    console.log(`📧 Sending Welcome email to ${testRecipient}...`);
    const welcomeSent = await sendWelcomeEmail(testRecipient, 'Test User');
    console.log(welcomeSent ? '✅ Welcome email sent!' : '❌ Welcome email failed');

    console.log(`\n📧 Sending Password Reset email to ${testRecipient}...`);
    const resetSent = await sendPasswordResetEmail(testRecipient, 'test-token-12345', 'Test User');
    console.log(resetSent ? '✅ Password reset email sent!' : '❌ Password reset email failed');

    console.log('\n✨ Integration test complete!');
  } catch (error) {
    console.error('❌ Integration test error:', error);
  }
};

testEmail();
