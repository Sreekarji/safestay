import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailParams): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: `"SafeStay" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Email send failed: ${error}`);
    return false;
  }
};

export default transporter;
