export const otpEmailTemplate = (otp: string, purpose: string): string => {
  const title = purpose === 'verification' ? 'Verify Your Email' : 'Reset Your Password';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; text-align: center; }
        .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .warning { color: #e74c3c; font-size: 14px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ SafeStay</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <p>Your one-time password (OTP) is:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This OTP is valid for 10 minutes.</p>
          <p class="warning">⚠️ Do not share this OTP with anyone.</p>
        </div>
        <div class="footer">
          <p>SafeStay — AI-powered Safety Intelligence Network</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const welcomeEmailTemplate = (name: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; text-align: center; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ Welcome to SafeStay</h1>
        </div>
        <div class="content">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for joining SafeStay — the AI-powered Safety Intelligence Network for student accommodations.</p>
          <p>You can now:</p>
          <ul style="text-align: left; display: inline-block;">
            <li>📊 View SafeStay Safety Index (SSI) for accommodations</li>
            <li>📝 Submit verified safety reports</li>
            <li>🗺️ Explore the interactive safety map</li>
          </ul>
          <p>Verify your email to unlock full features!</p>
        </div>
        <div class="footer">
          <p>SafeStay — AI-powered Safety Intelligence Network</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
