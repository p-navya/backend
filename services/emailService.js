import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'navyadhritii@gmail.com',
      pass: 'cxxx qlin lyai slmq', // App password
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Email template for mentor credentials
const createMentorCredentialsTemplate = (data) => {
  const { mentorName, email, password } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to StudyBuddy AI - Mentor Credentials</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }
            .email-container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .header h1 {
                background: linear-gradient(to right, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 0;
                font-size: 28px;
            }
            .greeting {
                font-size: 18px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 20px;
            }
            .content {
                margin-bottom: 25px;
            }
            .credentials-box {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .credentials-box h3 {
                margin-top: 0;
                color: white;
            }
            .credential-item {
                margin: 10px 0;
                padding: 10px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 5px;
            }
            .credential-label {
                font-weight: bold;
                margin-right: 10px;
            }
            .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
            }
            .button {
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>🎓 StudyBuddy AI Platform</h1>
            </div>
            
            <div class="greeting">
                Dear ${mentorName},
            </div>
            
            <div class="content">
                <p>Welcome to StudyBuddy AI Platform! We're excited to have you join our team as a mentor.</p>
                
                <p>Your mentor account has been created successfully. Please find your login credentials below:</p>
                
                <div class="credentials-box">
                    <h3>🔐 Your Login Credentials</h3>
                    <div class="credential-item">
                        <span class="credential-label">Email:</span> ${email}
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Password:</span> ${password}
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong><br>
                    For security reasons, you <strong>must</strong> change your password when you log in for the first time. 
                    This temporary password should not be shared with anyone.
                </div>
                
                <p>To get started:</p>
                <ol>
                    <li>Log in using the credentials provided above</li>
                    <li>You will be prompted to change your password</li>
                    <li>Set a strong, secure password that you'll remember</li>
                    <li>Start mentoring students and making a difference!</li>
                </ol>
                
                <div style="text-align: center;">
                    <a href="http://localhost:5173/login" class="button">Login to StudyBuddy AI</a>
                </div>
                
                <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
                
                <p>We look forward to working with you!</p>
            </div>
            
            <div class="footer">
                <p><strong>Best regards,</strong><br>
                StudyBuddy AI Team</p>
                
                <p style="font-size: 14px; color: #999;">
                    📧 navyadhritii@gmail.com
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send mentor credentials email
export const sendMentorCredentialsEmail = async (data) => {
  try {
    console.log('📧 Attempting to send email to:', data.email);
    
    const transporter = createTransporter();
    
    // Verify transporter connection
    await transporter.verify();
    console.log('✅ Email server is ready');

    const mailOptions = {
      from: '"StudyBuddy AI" <navyadhritii@gmail.com>',
      to: data.email,
      subject: 'Welcome to StudyBuddy AI - Your Mentor Account Credentials',
      html: createMentorCredentialsTemplate(data),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Mentor credentials email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Sent to:', data.email);
    return true;
  } catch (error) {
    console.error('❌ Error sending mentor credentials email:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // More specific error messages
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication failed. Check your email and app password.');
    } else if (error.code === 'ECONNECTION' || error.code === 'ESOCKET') {
      console.error('🌐 Connection failed. Check your internet connection and firewall settings.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏱️ Connection timeout. Gmail servers might be slow.');
    }
    
    return false;
  }
};

