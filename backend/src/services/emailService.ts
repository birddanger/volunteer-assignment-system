import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function sendConfirmationEmail(
  to: string,
  volunteeName: string,
  taskTitle: string,
  taskTime: string,
  taskLocation: string,
  taskDescription: string,
  organizerContact: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@volunteerapp.com',
      to,
      subject: `Assignment Confirmation: ${taskTitle}`,
      html: `
        <h2>Assignment Confirmation</h2>
        <p>Hi ${volunteeName},</p>
        <p>You have been assigned to the following volunteer task:</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Task:</strong> ${taskTitle}</p>
          <p><strong>Time:</strong> ${taskTime}</p>
          <p><strong>Location:</strong> ${taskLocation}</p>
          <p><strong>Description:</strong> ${taskDescription}</p>
        </div>
        <p><strong>Organizer Contact:</strong> ${organizerContact}</p>
        <p>Please arrive 15 minutes early. Thank you for volunteering!</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    return false;
  }
}

export async function sendReminderEmail(
  to: string,
  volunteeName: string,
  taskTitle: string,
  taskTime: string,
  taskLocation: string,
  instructions: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@volunteerapp.com',
      to,
      subject: `Reminder: Your volunteer task tomorrow - ${taskTitle}`,
      html: `
        <h2>Task Reminder</h2>
        <p>Hi ${volunteeName},</p>
        <p>This is a reminder that you have a volunteer task <strong>tomorrow</strong>:</p>
        <div style="background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
          <p><strong>Task:</strong> ${taskTitle}</p>
          <p><strong>Time:</strong> ${taskTime}</p>
          <p><strong>Location:</strong> ${taskLocation}</p>
          <p><strong>Instructions:</strong> ${instructions}</p>
        </div>
        <p>Please arrive 15 minutes early. Thank you!</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    return false;
  }
}

export async function sendManualEmail(
  to: string[],
  subject: string,
  message: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@volunteerapp.com',
      to: to.join(','),
      subject,
      html: `
        <h2>${subject}</h2>
        <p>${message}</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Failed to send manual email:', error);
    return false;
  }
}
