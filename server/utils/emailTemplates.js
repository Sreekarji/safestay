const getBaseTemplate = (title, content, buttonText, buttonLink, color = '#3b82f6') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center;">
            <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${color} 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🏠 Student Safety Platform</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${content}
                  
                  <!-- CTA Button -->
                  ${buttonText && buttonLink ? `
                  <table role="presentation" style="margin: 30px 0; width: 100%;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="${buttonLink}" style="background-color: ${color}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                          ${buttonText}
                        </a>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    Made with ❤️ for student safety and welfare
                  </p>
                  <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                    If you didn't request this email, please ignore it.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const welcomeEmail = (userName, verificationLink) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${userName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Welcome to the Student Accommodation Safety Platform! We're excited to have you join our community dedicated to improving student living conditions.
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Please verify your email address to get started and access all platform features.
    </p>
  `;
  return getBaseTemplate('Welcome to Student Accommodation Safety Platform! 🎓', content, 'Verify Email Now', verificationLink, '#3b82f6');
};

const reportApprovedEmail = (userName, accommodationName, reportId, viewLink) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${userName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Great news! Your safety report for <strong>${accommodationName}</strong> has been approved by our administrators.
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      The property owner has been notified and requested to address the issues raised. You can track the progress of your report on your dashboard.
    </p>
  `;
  return getBaseTemplate('✅ Your safety report has been approved', content, 'View Report', viewLink, '#22c55e');
};

const reportRejectedEmail = (userName, accommodationName, reason) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${userName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Your safety report for <strong>${accommodationName}</strong> was not approved for publication.
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      <strong>Reason:</strong> ${reason}
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      If you believe this was a mistake, please contact our support team.
    </p>
  `;
  return getBaseTemplate('❌ Your safety report was not approved', content, 'Contact Admin', 'mailto:admin@studentsafety.com', '#ef4444');
};

const ownerNewReportEmail = (ownerName, accommodationName, issueType, reportLink) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${ownerName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      A new safety report has been filed for your property <strong>${accommodationName}</strong>.
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      <strong>Issue Type:</strong> ${issueType}
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Please review the details and resolve the issue as soon as possible to maintain your property's safety rating.
    </p>
  `;
  return getBaseTemplate('🚨 New safety report on your property', content, 'Resolve Now', reportLink, '#f59e0b');
};

const studentResolvedEmail = (studentName, accommodationName, resolutionDetails, verifyLink) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${studentName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      The owner of <strong>${accommodationName}</strong> has marked your report as resolved.
    </p>
    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
      <p style="color: #1f2937; font-weight: bold; margin: 0 0 10px 0;">Resolution Details:</p>
      <p style="color: #4b5563; margin: 0;">${resolutionDetails.description || resolutionDetails.actionTaken}</p>
    </div>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Please verify if the issue has been fixed to your satisfaction.
    </p>
  `;
  return getBaseTemplate('🔧 Owner has resolved your report', content, 'Verify Resolution', verifyLink, '#3b82f6');
};

const ownerVerifiedEmail = (ownerName, accommodationName, feedback, trustScoreChange) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${ownerName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Great job! A student has verified your resolution for <strong>${accommodationName}</strong>.
    </p>
    <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #10b981;">
      <p style="color: #065f46; font-weight: bold; margin: 0 0 5px 0;">Student Feedback:</p>
      <p style="color: #065f46; font-style: italic; margin: 0;">"${feedback}"</p>
      <p style="color: #065f46; font-weight: bold; margin: 10px 0 0 0;">Trust Score Impact: <span style="font-size: 18px;">${trustScoreChange}</span></p>
    </div>
    <p style="color: #4b5563; line-height: 1.6;">
      Keeping your property safe and students happy improves your standing on the platform.
    </p>
  `;
  return getBaseTemplate('✅ Student verified your resolution - Trust score improved!', content, 'View Dashboard', '#', '#22c55e');
};

const ownerDisputedEmail = (ownerName, accommodationName, disputeReason, resolveAgainLink) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${ownerName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      A student has disputed your resolution for <strong>${accommodationName}</strong>.
    </p>
    <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
      <p style="color: #92400e; font-weight: bold; margin: 0 0 5px 0;">Dispute Reason:</p>
      <p style="color: #92400e; margin: 0;">${disputeReason}</p>
    </div>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Please address the remaining issues and update the resolution status.
    </p>
  `;
  return getBaseTemplate('⚠️ Student disputed your resolution', content, 'Resolve Again', resolveAgainLink, '#eab308');
};

const passwordResetSuccessEmail = (userName) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${userName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      This is a confirmation that your password for your Student Safety Platform account has been successfully reset.
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      If you did not perform this action, please contact our security team immediately.
    </p>
  `;
  return getBaseTemplate('🔒 Your password has been reset', content, 'Login Now', '#', '#3b82f6');
};

module.exports = {
  welcomeEmail,
  reportApprovedEmail,
  reportRejectedEmail,
  ownerNewReportEmail,
  studentResolvedEmail,
  ownerVerifiedEmail,
  ownerDisputedEmail,
  passwordResetSuccessEmail
};
