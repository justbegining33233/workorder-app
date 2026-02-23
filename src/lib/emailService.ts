// Email service for notifications
// Configure with Resend or SendGrid API key in environment variables

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Email templates
export const emailTemplates = {
  inventoryRequestCreated: (shopName: string, itemName: string, quantity: number, urgency: string) => ({
    subject: `[${urgency.toUpperCase()}] New Inventory Request - ${itemName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e5332a;">New Inventory Request</h2>
        <p>A new inventory request has been submitted for <strong>${shopName}</strong>:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Item:</strong> ${itemName}</p>
          <p><strong>Quantity:</strong> ${quantity}</p>
          <p><strong>Urgency:</strong> <span style="color: ${urgency === 'urgent' ? '#ef4444' : urgency === 'high' ? '#f59e0b' : '#22c55e'};">${urgency}</span></p>
        </div>
        <p>Please review and approve or deny this request in the shop admin panel.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop/admin" style="display: inline-block; background: #e5332a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Request</a>
      </div>
    `,
  }),

  inventoryRequestApproved: (itemName: string, quantity: number) => ({
    subject: `Inventory Request Approved - ${itemName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">✅ Request Approved</h2>
        <p>Your inventory request has been approved:</p>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
          <p><strong>Item:</strong> ${itemName}</p>
          <p><strong>Quantity:</strong> ${quantity}</p>
          <p><strong>Status:</strong> <span style="color: #22c55e;">Approved</span></p>
        </div>
        <p>The item will be ordered and made available soon.</p>
      </div>
    `,
  }),

  inventoryRequestDenied: (itemName: string, quantity: number, reason?: string) => ({
    subject: `Inventory Request Denied - ${itemName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">❌ Request Denied</h2>
        <p>Your inventory request has been denied:</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p><strong>Item:</strong> ${itemName}</p>
          <p><strong>Quantity:</strong> ${quantity}</p>
          <p><strong>Status:</strong> <span style="color: #ef4444;">Denied</span></p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        <p>Please contact your shop admin for more information.</p>
      </div>
    `,
  }),
  lowStockAlert: (itemName: string, quantity: number, reorderPoint: number) => ({
    subject: `⚠️ Low Stock Alert - ${itemName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⚠️ Low Stock Alert</h2>
        <p>Inventory levels are running low:</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p><strong>Item:</strong> ${itemName}</p>
          <p><strong>Current Quantity:</strong> ${quantity}</p>
          <p><strong>Reorder Point:</strong> ${reorderPoint}</p>
        </div>
        <p>Please reorder this item to avoid stockouts.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop/inventory" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Inventory</a>
      </div>
    `,
  }),
  clockInReminder: (techName: string) => ({
    subject: 'Clock-In Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">⏰ Time to Clock In</h2>
        <p>Hi ${techName},</p>
        <p>This is a friendly reminder to clock in for your shift.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/tech/home" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Clock In Now</a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">Don't forget to clock out at the end of your shift!</p>
      </div>
    `,
  }),

  payrollBudgetAlert: (shopName: string, currentSpend: number, budget: number, percentage: number) => ({
    subject: `💰 Payroll Budget Alert - ${percentage}% Used`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${percentage >= 90 ? '#ef4444' : '#f59e0b'};">💰 Payroll Budget Alert</h2>
        <p><strong>${shopName}</strong> payroll spending update:</p>
        <div style="background: ${percentage >= 90 ? '#fef2f2' : '#fffbeb'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${percentage >= 90 ? '#ef4444' : '#f59e0b'};">
          <p><strong>Current Spend:</strong> $${currentSpend.toFixed(2)}</p>
          <p><strong>Budget:</strong> $${budget.toFixed(2)}</p>
          <p><strong>Percentage Used:</strong> <span style="color: ${percentage >= 90 ? '#ef4444' : '#f59e0b'};">${percentage}%</span></p>
        </div>
        ${percentage >= 90 ? '<p style="color: #ef4444; font-weight: bold;">⚠️ Warning: You have used over 90% of your payroll budget!</p>' : '<p>You are approaching your payroll budget limit.</p>'}
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop/admin" style="display: inline-block; background: #e5332a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Payroll</a>
      </div>
    `,
  }),

  estimateReady: (customerName: string, workOrderId: string, serviceAmount: number, totalDue: number, shopName: string, description: string) => ({
    subject: `Your Estimate Is Ready — ${shopName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 0; border-radius: 10px; overflow: hidden;">
        <div style="background: #e5332a; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900;">FixTray</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Vehicle Repair & Service</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #111827; margin: 0 0 8px;">📋 Your Estimate Is Ready</h2>
          <p style="color: #6b7280; margin: 0 0 24px;">Hi ${customerName}, ${shopName} has prepared an estimate for your vehicle service.</p>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
            <p style="margin: 0 0 8px; color: #374151;"><strong>Service:</strong> ${description}</p>
            <p style="margin: 0 0 8px; color: #374151;"><strong>Service Cost:</strong> $${serviceAmount.toFixed(2)}</p>
            <p style="margin: 0 0 8px; color: #374151;"><strong>FixTray Fee:</strong> $5.00</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;" />
            <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 700;"><strong>Total Due: $${totalDue.toFixed(2)}</strong></p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/workorders/${workOrderId}" style="display: block; background: #22c55e; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; text-align: center;">Review &amp; Pay Estimate</a>
          <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">This estimate was prepared by ${shopName} and requires your approval before work begins.</p>
        </div>
      </div>
    `,
  }),

  jobCompleted: (customerName: string, workOrderId: string, totalDue: number, shopName: string, description: string) => ({
    subject: `Your Vehicle Is Ready for Pickup — ${shopName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 0; border-radius: 10px; overflow: hidden;">
        <div style="background: #e5332a; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900;">FixTray</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Vehicle Repair & Service</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #111827; margin: 0 0 8px;">🎉 Job Complete — Your Vehicle Is Ready!</h2>
          <p style="color: #6b7280; margin: 0 0 24px;">Hi ${customerName}, great news! ${shopName} has finished work on your vehicle.</p>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
            <p style="margin: 0 0 8px; color: #374151;"><strong>Work Completed:</strong> ${description}</p>
            <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 700;"><strong>Amount Due: $${totalDue.toFixed(2)}</strong></p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/workorders/${workOrderId}" style="display: block; background: #22c55e; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; text-align: center;">Pay Now &amp; Schedule Pickup</a>
          <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">Secured by Stripe • PCI DSS Compliant</p>
        </div>
      </div>
    `,
  }),

  paymentReceipt: (customerName: string, workOrderId: string, amountPaid: number, shopName: string, description: string) => ({
    subject: `Payment Receipt — ${shopName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 0; border-radius: 10px; overflow: hidden;">
        <div style="background: #e5332a; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900;">FixTray</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Payment Receipt</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #22c55e; margin: 0 0 8px;">✅ Payment Successful</h2>
          <p style="color: #6b7280; margin: 0 0 24px;">Hi ${customerName}, your payment to ${shopName} was received successfully.</p>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
            <p style="margin: 0 0 8px; color: #374151;"><strong>Service:</strong> ${description}</p>
            <p style="margin: 0 0 8px; color: #374151;"><strong>Shop:</strong> ${shopName}</p>
            <p style="margin: 0 0 8px; color: #374151;"><strong>Work Order:</strong> #${workOrderId.slice(-8).toUpperCase()}</p>
            <p style="margin: 0 0 8px; color: #374151;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;" />
            <p style="margin: 0; color: #22c55e; font-size: 20px; font-weight: 700;">Amount Paid: $${amountPaid.toFixed(2)}</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/workorders/${workOrderId}" style="display: block; background: #3b82f6; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; text-align: center;">View Work Order</a>
          <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">Keep this email as your receipt. Thank you for using FixTray!</p>
        </div>
      </div>
    `,
  }),

  shopApproved: (shopName: string, ownerEmail: string, username: string, tempPassword?: string | null) => ({
    subject: `🎉 Your Shop Has Been Approved — Welcome to FixTray!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 0; border-radius: 10px; overflow: hidden;">
        <div style="background: #e5332a; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900;">FixTray</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Shop Management Platform</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #22c55e; margin: 0 0 8px;">🎉 Congratulations! Your Shop Is Approved</h2>
          <p style="color: #6b7280; margin: 0 0 24px;"><strong>${shopName}</strong> has been approved on the FixTray platform. You can now log in and start managing work orders.</p>
          ${tempPassword ? `
          <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
            <p style="margin: 0 0 8px; color: #374151; font-weight: 700;">Your Login Credentials</p>
            <p style="margin: 0 0 8px; color: #374151;"><strong>Username:</strong> ${username}</p>
            <p style="margin: 0; color: #374151;"><strong>Temporary Password:</strong> <code style="background: #fef9c3; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
            <p style="margin: 8px 0 0; color: #92400e; font-size: 12px;">⚠️ Please change your password after your first login.</p>
          </div>
          ` : `
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
            <p style="margin: 0; color: #374151;"><strong>Username:</strong> ${username}</p>
          </div>
          `}
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" style="display: block; background: #e5332a; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; text-align: center;">Log In to Your Shop</a>
          <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">Welcome to FixTray — the easiest way to manage your auto shop.</p>
        </div>
      </div>
    `,
  }),
};

// Send email function (configure with your email service)
export async function sendEmail({ to, subject, html, from }: EmailOptions): Promise<boolean> {
  try {
    // For Resend
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: from || process.env.RESEND_FROM_EMAIL || 'notifications@yourdomain.com',
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        console.error('Resend API error:', await response.text());
        return false;
      }

      return true;
    }

    // No email service configured - log to console in development
    console.log('📧 Email would be sent:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html.substring(0, 200)}...`);
    
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

// Helper to send notification emails
export async function sendInventoryRequestNotification(
  shopEmail: string,
  shopName: string,
  itemName: string,
  quantity: number,
  urgency: string
) {
  const template = emailTemplates.inventoryRequestCreated(shopName, itemName, quantity, urgency);
  return sendEmail({
    to: shopEmail,
    ...template,
  });
}

export async function sendInventoryApprovalNotification(
  techEmail: string,
  itemName: string,
  quantity: number,
  approved: boolean,
  reason?: string
) {
  const template = approved
    ? emailTemplates.inventoryRequestApproved(itemName, quantity)
    : emailTemplates.inventoryRequestDenied(itemName, quantity, reason);
  
  return sendEmail({
    to: techEmail,
    ...template,
  });
}

export async function sendLowStockAlert(
  shopEmail: string,
  itemName: string,
  quantity: number,
  reorderPoint: number
) {
  const template = emailTemplates.lowStockAlert(itemName, quantity, reorderPoint);
  
  return sendEmail({
    to: shopEmail,
    ...template,
  });
}

export async function sendEstimateReadyEmail(
  customerEmail: string,
  customerName: string,
  workOrderId: string,
  serviceAmount: number,
  totalDue: number,
  shopName: string,
  description: string
) {
  const template = emailTemplates.estimateReady(customerName, workOrderId, serviceAmount, totalDue, shopName, description);
  return sendEmail({ to: customerEmail, ...template });
}

export async function sendJobCompletedEmail(
  customerEmail: string,
  customerName: string,
  workOrderId: string,
  totalDue: number,
  shopName: string,
  description: string
) {
  const template = emailTemplates.jobCompleted(customerName, workOrderId, totalDue, shopName, description);
  return sendEmail({ to: customerEmail, ...template });
}

export async function sendPaymentReceiptEmail(
  customerEmail: string,
  customerName: string,
  workOrderId: string,
  amountPaid: number,
  shopName: string,
  description: string
) {
  const template = emailTemplates.paymentReceipt(customerName, workOrderId, amountPaid, shopName, description);
  return sendEmail({ to: customerEmail, ...template });
}

export async function sendShopApprovedEmail(
  shopEmail: string,
  shopName: string,
  username: string,
  tempPassword?: string | null
) {
  const template = emailTemplates.shopApproved(shopName, shopEmail, username, tempPassword);
  return sendEmail({ to: shopEmail, ...template });
}
