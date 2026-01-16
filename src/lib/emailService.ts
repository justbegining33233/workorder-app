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

    // For SendGrid
    if (process.env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from || process.env.SENDGRID_FROM_EMAIL || 'notifications@yourdomain.com' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });

      if (!response.ok) {
        console.error('SendGrid API error:', await response.text());
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
