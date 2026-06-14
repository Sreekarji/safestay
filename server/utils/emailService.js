const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const emailTemplates = require('./emailTemplates');

transporter.verify()
  .then(() => console.log('Email service ready'))
  .catch(err => console.error('Email service error:', err.message));

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generic email sender
async function sendEmail(to, subject, htmlContent) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials not configured');
      return { success: false, message: 'Email not configured' };
    }

    const mailOptions = {
      from: `"Student Safety Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

// Specific email senders
async function sendWelcomeEmail(userEmail, userName, verificationLink) {
  const html = emailTemplates.welcomeEmail(userName, verificationLink);
  return sendEmail(userEmail, 'Welcome to Student Accommodation Safety Platform! 🎓', html);
}

async function sendReportApprovedEmail(userEmail, userName, accommodationName, reportId, viewLink) {
  const html = emailTemplates.reportApprovedEmail(userName, accommodationName, reportId, viewLink);
  return sendEmail(userEmail, '✅ Your safety report has been approved', html);
}

async function sendReportRejectedEmail(userEmail, userName, accommodationName, reason) {
  const html = emailTemplates.reportRejectedEmail(userName, accommodationName, reason);
  return sendEmail(userEmail, '❌ Your safety report was not approved', html);
}

async function sendOwnerNewReportEmail(ownerEmail, ownerName, accommodationName, issueType, reportLink) {
  const html = emailTemplates.ownerNewReportEmail(ownerName, accommodationName, issueType, reportLink);
  return sendEmail(ownerEmail, '🚨 New safety report on your property', html);
}

async function sendStudentResolvedEmail(studentEmail, studentName, accommodationName, resolutionDetails, verifyLink) {
  const html = emailTemplates.studentResolvedEmail(studentName, accommodationName, resolutionDetails, verifyLink);
  return sendEmail(studentEmail, '🔧 Owner has resolved your report', html);
}

async function sendOwnerVerifiedEmail(ownerEmail, ownerName, accommodationName, feedback, trustScoreChange) {
  const html = emailTemplates.ownerVerifiedEmail(ownerName, accommodationName, feedback, trustScoreChange);
  return sendEmail(ownerEmail, '✅ Student verified your resolution - Trust score improved!', html);
}

async function sendOwnerDisputedEmail(ownerEmail, ownerName, accommodationName, disputeReason, resolveAgainLink) {
  const html = emailTemplates.ownerDisputedEmail(ownerName, accommodationName, disputeReason, resolveAgainLink);
  return sendEmail(ownerEmail, '⚠️ Student disputed your resolution', html);
}

async function sendPasswordResetSuccessEmail(userEmail, userName) {
  const html = emailTemplates.passwordResetSuccessEmail(userName);
  return sendEmail(userEmail, '🔒 Your password has been reset', html);
}

async function sendOTPEmail(to, otp, type) {
  const isVerification = type === 'verification';

  const subject = isVerification
    ? 'Verify Your Email - SafeStay'
    : 'Reset Your Password - SafeStay';

  const heading = isVerification
    ? 'Email Verification'
    : 'Password Reset';

  const message = isVerification
    ? 'Thank you for registering on SafeStay. Use the code below to verify your email address.'
    : 'We received a request to reset your password. Use the code below to proceed.';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🏠 SafeStay</h1>
        <p style="color: #dbeafe; margin-top: 8px;">Student Accommodation Safety Platform</p>
      </div>
      <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1e293b; margin-top: 0;">${heading}</h2>
        <p style="color: #475569; line-height: 1.6;">${message}</p>
        <div style="background: white; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
          <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Your verification code:</p>
          <h1 style="color: #1d4ed8; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #ef4444; font-size: 14px; font-weight: bold;">⏰ This code expires in 10 minutes.</p>
        <p style="color: #475569; font-size: 14px;">If you did not request this, please ignore this email.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          This email was sent by SafeStay Platform. Do not reply to this email.
        </p>
      </div>
    </div>
  `;

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials not configured');
      return { success: false, message: 'Email not configured' };
    }

    await transporter.sendMail({
      from: `"SafeStay" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, message: error.message };
  }
}

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendReportApprovedEmail,
  sendReportRejectedEmail,
  sendOwnerNewReportEmail,
  sendStudentResolvedEmail,
  sendOwnerVerifiedEmail,
  sendOwnerDisputedEmail,
  sendPasswordResetSuccessEmail
};
