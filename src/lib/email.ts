import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email error:', error);
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <h1>Welcome to Work Order System!</h1>
    <p>Hi ${name},</p>
    <p>Thank you for registering with us. You can now create work orders and track your vehicle service needs.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login">Login to your account</a></p>
  `;
  await sendEmail(email, 'Welcome to Work Order System', html);
}

export async function sendWorkOrderCreatedEmail(email: string, workOrderId: string) {
  const html = `
    <h1>Work Order Created</h1>
    <p>Your work order #${workOrderId} has been created successfully.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/workorders/${workOrderId}">View Work Order</a></p>
  `;
  await sendEmail(email, 'Work Order Created', html);
}

export async function sendEstimateEmail(email: string, workOrderId: string, amount: number) {
  const html = `
    <h1>Estimate Ready</h1>
    <p>Your estimate for work order #${workOrderId} is ready.</p>
    <p>Amount: $${amount.toFixed(2)}</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/workorders/${workOrderId}">View & Accept Estimate</a></p>
  `;
  await sendEmail(email, 'Estimate Ready', html);
}

export async function sendStatusUpdateEmail(email: string, workOrderId: string, status: string) {
  const html = `
    <h1>Work Order Status Update</h1>
    <p>Your work order #${workOrderId} status has been updated to: <strong>${status}</strong></p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/workorders/${workOrderId}">View Work Order</a></p>
  `;
  await sendEmail(email, 'Work Order Status Update', html);
}

export async function sendPaymentConfirmationEmail(email: string, workOrderId: string, amount: number) {
  const html = `
    <h1>Payment Confirmation</h1>
    <p>Thank you for your payment of $${amount.toFixed(2)} for work order #${workOrderId}.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/workorders/${workOrderId}">View Invoice</a></p>
  `;
  await sendEmail(email, 'Payment Confirmation', html);
}

export async function sendLowStockAlert(
  email: string,
  shopName: string,
  itemName: string,
  currentStock: number,
  reorderPoint: number
) {
  const html = `
    <h1>Low Stock Alert - ${shopName}</h1>
    <p><strong>${itemName}</strong> is running low on stock.</p>
    <p>Current Stock: ${currentStock}</p>
    <p>Reorder Point: ${reorderPoint}</p>
    <p>Please order more inventory to avoid stockouts.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/shop/parts-labor">Manage Inventory</a></p>
  `;
  await sendEmail(email, `Low Stock Alert: ${itemName}`, html);
}

export async function sendAppointmentConfirmation(
  email: string,
  customerName: string,
  shopName: string,
  appointmentDate: Date,
  serviceType: string
) {
  const html = `
    <h1>Appointment Confirmed</h1>
    <p>Hi ${customerName},</p>
    <p>Your appointment has been confirmed!</p>
    <p><strong>Shop:</strong> ${shopName}</p>
    <p><strong>Date:</strong> ${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString()}</p>
    <p><strong>Service:</strong> ${serviceType}</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/appointments">View Appointments</a></p>
  `;
  await sendEmail(email, 'Appointment Confirmation', html);
}

export async function sendAppointmentReminder(
  email: string,
  customerName: string,
  shopName: string,
  appointmentDate: Date,
  serviceType: string
) {
  const html = `
    <h1>Appointment Reminder</h1>
    <p>Hi ${customerName},</p>
    <p>This is a reminder about your upcoming appointment:</p>
    <p><strong>Shop:</strong> ${shopName}</p>
    <p><strong>Date:</strong> ${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString()}</p>
    <p><strong>Service:</strong> ${serviceType}</p>
    <p>See you soon!</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/appointments">View Appointments</a></p>
  `;
  await sendEmail(email, 'Appointment Reminder', html);
}

export async function sendLowStockEmail(email: string, itemName: string, quantity: number, reorderPoint: number) {
  const html = `
    <h1>Low Stock Alert</h1>
    <p>Item: ${itemName}</p>
    <p>Current quantity: ${quantity}</p>
    <p>Reorder point: ${reorderPoint}</p>
    <p>Please reorder soon.</p>
  `;
  await sendEmail(email, 'Low Stock Alert', html);
}
