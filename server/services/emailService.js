const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

/**
 * Email Service for sending OTP and notifications
 * Uses nodemailer with SMTP configuration
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configure transporter based on environment
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    // For development/testing without real SMTP
    if (!process.env.SMTP_USER) {
      console.warn('⚠️  SMTP credentials not configured. Using test account...');
      // Will create test account on first use
      this.createTestAccount();
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service error:', error.message);
      } else {
        console.log('✅ Email service ready');
      }
    });
  }

  async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('📧 Test email account created:');
      console.log('   User:', testAccount.user);
      console.log('   Pass:', testAccount.pass);
      console.log('   Preview emails at: https://ethereal.email');
    } catch (error) {
      console.error('Failed to create test account:', error.message);
    }
  }

  /**
   * Send OTP email for Multi-Factor Authentication
   */
  async sendOTP(email, otp, username) {
    try {
      const mailOptions = {
        from: `"SecureEval MFA" <${process.env.SMTP_USER || 'noreply@secureeval.com'}>`,
        to: email,
        subject: '🔐 Your SecureEval Authentication Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Courier New', Consolas, monospace;
                background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
                padding: 40px 20px;
                color: #e0e0e0;
              }
              .container { 
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid rgba(102, 126, 234, 0.3);
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2), 0 0 0 1px rgba(102, 126, 234, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: repeating-linear-gradient(
                  0deg,
                  rgba(255,255,255,0.03) 0px,
                  rgba(255,255,255,0.03) 1px,
                  transparent 1px,
                  transparent 2px
                );
              }
              .shield-icon {
                font-size: 48px;
                margin-bottom: 10px;
                filter: drop-shadow(0 0 10px rgba(255,255,255,0.5));
              }
              .header h1 { 
                font-size: 24px;
                font-weight: 600;
                color: white;
                text-shadow: 0 2px 10px rgba(0,0,0,0.3);
                position: relative;
                z-index: 1;
              }
              .header p {
                font-size: 12px;
                color: rgba(255,255,255,0.8);
                margin-top: 5px;
                position: relative;
                z-index: 1;
              }
              .content { 
                padding: 40px 30px;
                background: #0d1117;
              }
              .greeting {
                color: #58a6ff;
                font-size: 16px;
                margin-bottom: 20px;
              }
              .message {
                color: #c9d1d9;
                line-height: 1.6;
                margin-bottom: 30px;
              }
              .terminal-box {
                background: #010409;
                border: 1px solid rgba(102, 126, 234, 0.4);
                border-radius: 8px;
                padding: 20px;
                margin: 30px 0;
                position: relative;
              }
              .terminal-header {
                display: flex;
                gap: 6px;
                margin-bottom: 15px;
              }
              .terminal-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
              }
              .dot-red { background: #ff5f56; }
              .dot-yellow { background: #ffbd2e; }
              .dot-green { background: #27c93f; }
              .terminal-label {
                color: #8b949e;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 15px;
              }
              .otp-container {
                text-align: center;
                padding: 20px 0;
              }
              .otp-code { 
                font-size: 42px;
                font-weight: bold;
                color: #667eea;
                letter-spacing: 12px;
                text-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
                animation: glow 2s ease-in-out infinite alternate;
              }
              @keyframes glow {
                from { text-shadow: 0 0 20px rgba(102, 126, 234, 0.5); }
                to { text-shadow: 0 0 30px rgba(102, 126, 234, 0.8), 0 0 40px rgba(102, 126, 234, 0.6); }
              }
              .expiry {
                color: #8b949e;
                font-size: 12px;
                margin-top: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
              }
              .warning-box {
                background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%);
                border-left: 4px solid #ffc107;
                padding: 20px;
                margin: 25px 0;
                border-radius: 4px;
              }
              .warning-title {
                color: #ffc107;
                font-weight: bold;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .warning-list {
                color: #c9d1d9;
                margin-left: 20px;
                font-size: 13px;
                line-height: 1.8;
              }
              .warning-list li {
                margin: 5px 0;
              }
              .meta-info {
                background: rgba(102, 126, 234, 0.05);
                border: 1px solid rgba(102, 126, 234, 0.2);
                border-radius: 6px;
                padding: 15px;
                margin-top: 25px;
                font-size: 12px;
                color: #8b949e;
              }
              .meta-info strong {
                color: #58a6ff;
              }
              .footer { 
                background: #010409;
                padding: 25px;
                text-align: center;
                border-top: 1px solid rgba(102, 126, 234, 0.2);
              }
              .footer-logo {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-bottom: 15px;
                color: #58a6ff;
              }
              .footer-text {
                font-size: 11px;
                color: #6e7681;
                line-height: 1.5;
              }
              .status-indicator {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                margin-top: 10px;
              }
              .status-dot {
                width: 8px;
                height: 8px;
                background: #27c93f;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(39, 201, 63, 0.6);
                animation: pulse 2s ease-in-out infinite;
              }
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="shield-icon">🛡️</div>
                <h1>SecureEval</h1>
                <p>Multi-Factor Authentication System</p>
              </div>
              
              <div class="content">
                
                <p class="message">
                  Authentication request detected. To complete your secure login to SecureEval, 
                  enter the following One-Time Password (OTP) within the next 5 minutes.
                </p>

                <div class="terminal-box">
                  <div class="terminal-header">
                    <div class="terminal-dot dot-red"></div>
                    <div class="terminal-dot dot-yellow"></div>
                    <div class="terminal-dot dot-green"></div>
                  </div>
                  <div class="terminal-label">→ OTP Authentication Code</div>
                  <div class="otp-container">
                    <div class="otp-code">${otp}</div>
                    <div class="expiry">
                      <span>⏱</span>
                      <span>Expires in 5 minutes</span>
                    </div>
                  </div>
                </div>

                <div class="warning-box">
                  <div class="warning-title">
                    <span>⚠️</span>
                    <span>SECURITY ALERT</span>
                  </div>
                  <ul class="warning-list">
                    <li>Never share this code with anyone - including SecureEval staff</li>
                    <li>This code is valid for 5 minutes only</li>
                    <li>If you didn't initiate this login, secure your account immediately</li>
                    <li>Suspicious activity will be logged and monitored</li>
                  </ul>
                </div>

                <div class="meta-info">
                  <strong>Session Details:</strong><br>
                  Timestamp: ${new Date().toISOString()}<br>
                  Location: [Masked for Security]<br>
                  Request ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
              </div>

              <div class="footer">
                <div class="footer-logo">
                  <span>🔒</span>
                  <span>SecureEval v1.0</span>
                </div>
                <div class="footer-text">
                  This is an automated security notification from the SecureEval Authentication System.<br>
                  © ${new Date().getFullYear()} SecureEval - Cybersecurity Project Evaluation Platform
                </div>
                <div class="status-indicator">
                  <div class="status-dot"></div>
                  <span style="font-size: 10px; color: #6e7681;">All Systems Operational</span>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
╔══════════════════════════════════════════════╗
║     SecureEval - Authentication System      ║
╚══════════════════════════════════════════════╝

Hello ${username},

Your One-Time Password (OTP) is:

    ${otp}

⏱  Valid for: 5 minutes
📧 Email: ${email}
🕐 Time: ${new Date().toLocaleString()}

⚠️  SECURITY NOTICE:
- Never share this code with anyone
- SecureEval staff will never ask for your OTP
- If you didn't request this, secure your account immediately

This is an automated message from SecureEval Authentication System.
© ${new Date().getFullYear()} SecureEval
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('✅ OTP email sent:', info.messageId);

      // For test accounts, show preview URL
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('📧 Preview email: %s', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info) || null,
      };
    } catch (error) {
      console.error('❌ Email send error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send welcome email after registration
   */
  async sendWelcomeEmail(email, username) {
    try {
      const mailOptions = {
        from: `"SecureEval" <${process.env.SMTP_USER || 'noreply@secureeval.com'}>`,
        to: email,
        subject: '🎉 Welcome to SecureEval!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🛡️ Welcome to SecureEval!</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${username}</strong>,</p>
                <p>Your account has been successfully created with enterprise-grade security features:</p>
                <ul>
                  <li>✅ Multi-Factor Authentication (MFA)</li>
                  <li>✅ PBKDF2 Password Hashing</li>
                  <li>✅ Role-Based Access Control</li>
                  <li>✅ AES-256 Encryption</li>
                </ul>
                <p>You can now login to access the secure project evaluation system.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} SecureEval</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', info.messageId);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Welcome email error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
