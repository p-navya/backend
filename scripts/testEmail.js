import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const testEmail = async () => {
  try {
    console.log('🔍 Testing email configuration...\n');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'navyadhritii@gmail.com',
        pass: 'cxxx qlin lyai slmq',
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('📡 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP server is ready!\n');

    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: '"StudyBuddy AI" <navyadhritii@gmail.com>',
      to: 'navyadhritii@gmail.com', // Send to yourself for testing
      subject: 'Test Email from StudyBuddy AI',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from StudyBuddy AI backend.</p>
        <p>If you receive this, your email configuration is working correctly!</p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Check your inbox at: navyadhritii@gmail.com');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔐 Authentication Error:');
      console.error('   - Check if your Gmail app password is correct');
      console.error('   - Make sure 2-factor authentication is enabled');
      console.error('   - Generate a new app password if needed');
    } else if (error.code === 'ECONNECTION' || error.code === 'ESOCKET') {
      console.error('\n🌐 Connection Error:');
      console.error('   - Check your internet connection');
      console.error('   - Check firewall settings');
      console.error('   - Try using port 465 with secure: true');
    }
  }
};

testEmail();

