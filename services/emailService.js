import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * EMAIL CONFIGURATION
 * Using the credentials provided by the user
 */
const EMAIL_USER = 'moksh.dev0411@gmail.com';
const EMAIL_PASS = 'aogz maqj cevm yhnk';

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
    });
};

/**
 * BASE EMAIL TEMPLATE
 * Adapted from the provided "MOKSH" layout for StudyBuddy AI
 */
const createEmailTemplate = (data) => {
    const {
        recipientName,
        title,
        content,
        buttonLink,
        buttonText,
        details
    } = data;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - StudyBuddy AI</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f7f9;
            }
            .email-container {
                background-color: #ffffff;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            }
            .logo {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo h2 {
                color: #14b8a6;
                font-size: 28px;
                margin: 0;
                font-family: 'Montserrat', sans-serif;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .greeting {
                font-size: 18px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 20px;
            }
            .content {
                margin-bottom: 25px;
                color: #4a5568;
            }
            .details-box {
                background-color: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #14b8a6;
            }
            .button-container {
                text-align: center;
                margin: 30px 0;
            }
            .button {
                background: linear-gradient(to right, #14b8a6, #22c55e);
                color: white !important;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: bold;
                display: inline-block;
                transition: transform 0.2s;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #edf2f7;
                color: #718096;
                font-size: 14px;
            }
            .contact-info {
                margin-top: 15px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="logo">
                <h2>StudyBuddy AI</h2>
            </div>
            
            <div class="header">
                <h1 style="color: #2d3748; margin: 0; font-size: 24px;">${title}</h1>
            </div>
            
            <div class="greeting">
                Hello ${recipientName},
            </div>
            
            <div class="content">
                ${content}
                
                ${details ? `<div class="details-box">${details}</div>` : ''}
                
                ${buttonLink ? `
                <div class="button-container">
                    <a href="${buttonLink}" class="button">${buttonText || 'Click Here'}</a>
                </div>
                ` : ''}
            </div>
            
            <p>If you have any questions or need assistance, feel free to reach out to us. We are here to support your learning journey.</p>
            
            <div class="footer">
                <p><strong>Success on your learning path,</strong><br>
                Team StudyBuddy AI</p>
                
                <div class="contact-info">
                    <p>📧 ${EMAIL_USER}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * SEND PASSWORD RESET EMAIL
 */
export const sendPasswordResetEmail = async (email, resetToken, recipientName = 'User') => {
    try {
        const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const templateData = {
            recipientName,
            title: 'Password Reset Request',
            content: `
                <p>We received a request to reset your password for your StudyBuddy AI account.</p>
                <p>To ensure your account stays secure, please use the button below to set a new password. This link will expire in 1 hour.</p>
            `,
            buttonLink: resetURL,
            buttonText: 'Reset Password',
            details: `
                <p style="margin:0;"><strong>Request Token:</strong> ${resetToken.substring(0, 8)}...</p>
                <p style="margin:5px 0 0 0; font-size: 12px; color: #718096;">If you did not request this, please ignore this email.</p>
            `
        };

        const transporter = createTransporter();
        const mailOptions = {
            from: `"StudyBuddy AI" <${EMAIL_USER}>`,
            to: email,
            subject: '🔐 Password Reset Request - StudyBuddy AI',
            html: createEmailTemplate(templateData),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
};

/**
 * SEND WELCOME EMAIL (REGISTRATION)
 */
export const sendWelcomeEmail = async (email, recipientName) => {
    try {
        const templateData = {
            recipientName,
            title: 'Welcome to StudyBuddy AI! 🚀',
            content: `
                <p>We're thrilled to have you join our community! StudyBuddy AI is designed to help you study smarter, not harder, using the power of agentic AI.</p>
                <p>Your journey towards personalized, efficient learning starts now. Log in to explore your dashboard and meet your AI study buddy.</p>
            `,
            buttonLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
            buttonText: 'Login to Your Dashboard'
        };

        const transporter = createTransporter();
        const mailOptions = {
            from: `"StudyBuddy AI" <${EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to StudyBuddy AI! 🎓',
            html: createEmailTemplate(templateData),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Welcome email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};

/**
 * SEND MENTOR CREDENTIALS EMAIL
 * Maintaining backward compatibility with adminController
 */
export const sendMentorCredentialsEmail = async (data) => {
    const { mentorName, email, password } = data;
    try {
        const templateData = {
            recipientName: mentorName,
            title: 'Your Mentor Account Credentials',
            content: `
                <p>Welcome to StudyBuddy AI! You have been registered as a Mentor on our platform.</p>
                <p>Please use the following temporary credentials to log in. You will be prompted to change your password on your first sign-in for security reasons.</p>
            `,
            buttonLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
            buttonText: 'Login as Mentor',
            details: `
                <p style="margin:0;"><strong>Email:</strong> ${email}</p>
                <p style="margin:5px 0 0 0;"><strong>Temporary Password:</strong> ${password}</p>
            `
        };

        const transporter = createTransporter();
        const mailOptions = {
            from: `"StudyBuddy AI" <${EMAIL_USER}>`,
            to: email,
            subject: '🎓 Your Mentor Account is Ready - StudyBuddy AI',
            html: createEmailTemplate(templateData),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Mentor credentials email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending mentor credentials email:', error);
        return false;
    }
};

/**
 * ECOMMERCE ORDER CONFIRMATION (Legacy/Support)
 * Based on the provided script from MOKSH
 */
export const sendOrderConfirmationEmail = async (data) => {
    const { customerName, eventName, amount, createdAt, customerEmail } = data;
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"StudyBuddy AI" <${EMAIL_USER}>`,
            to: customerEmail,
            subject: `Order Confirmation - ${eventName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #14b8a6;">Order Confirmation</h2>
                    <p>Dear ${customerName},</p>
                    <p>Thank you for your purchase related to <strong>${eventName}</strong>.</p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Amount Paid:</strong> ₹${amount}/-</p>
                        <p><strong>Date:</strong> ${createdAt}</p>
                    </div>
                    <p>We appreciate your trust in us!</p>
                    <p>Warm regards,<br>Team StudyBuddy AI / Moksh</p>
                </div>
            `,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Order email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending order email:', error);
        return false;
    }
};
