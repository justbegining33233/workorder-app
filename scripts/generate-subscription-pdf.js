const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;

const outputPath = path.join(__dirname, '..', 'public', 'subscription-services-matrix.pdf');

const planSummary = [
  ['Starter', '$99.88', '1', '1'],
  ['Growth', '$249.88', '5', '1'],
  ['Professional', '$499.88', '15', '1'],
  ['Business', '$749.88', '40', '5'],
  ['Enterprise', '$999.88', 'Unlimited', 'Unlimited'],
];

const serviceRows = [
  ['Core Operations', 'All Orders', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'In-Shop Jobs', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'Work Authorizations', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'Templates', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'Time Clock', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'Basic Reports', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'Email Notifications', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'File Uploads', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'Shop Settings', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'Two-Factor Auth', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'Sessions', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'Services Catalog', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'Bay Board', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'Loaners', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Core Operations', 'Environmental Fees', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ['Growth Features', 'Customer Messages', 'N', 'Y', 'Y', 'Y', 'Y'],
  ['Growth Features', 'Recurring Work Orders', 'N', 'Y', 'Y', 'Y', 'Y'],
  ['Growth Features', 'Waiting Room', 'N', 'Y', 'Y', 'Y', 'Y'],
  ['Growth Features', 'Manage Team', 'N', 'Y', 'Y', 'Y', 'Y'],
  ['Growth Features', 'Permissions', 'N', 'Y', 'Y', 'Y', 'Y'],
  ['Growth Features', 'Schedule', 'N', 'Y', 'Y', 'Y', 'Y'],
  ['Growth Features', 'Break Tracking', 'N', 'Y', 'Y', 'Y', 'Y'],
  ['Growth Features', 'GPS Verification', 'N', 'Y', 'Y', 'Y', 'Y'],
  ['Growth Features', 'DVI Inspections', 'N', 'Y', 'Y', 'Y', 'Y'],
  ['Growth Features', 'Condition Reports', 'N', 'Y', 'Y', 'Y', 'Y'],
  ['Growth Features', 'State Inspections', 'N', 'Y', 'Y', 'Y', 'Y'],
  ['Growth Features', 'Real-Time Dashboards', 'N', 'Y', 'Y', 'Y', 'Y'],
  ['Professional Features', 'Payroll', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'Inventory', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'Shared Inventory', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'Vendors', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'Purchase Orders', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'Core Returns', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'Budget Tracking', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'Advanced Reporting', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'EOD Report', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'SLA Metrics', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'Employee Performance', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'AR Aging', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'Profit Margins', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'Payment Links', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Professional Features', 'Reviews', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Business Features', 'Fleet Accounts', 'N', 'N', 'N', 'Y', 'Y'],
  ['Business Features', 'Customer CRM', 'N', 'N', 'N', 'Y', 'Y'],
  ['Business Features', 'Referrals', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Business Features', 'Campaigns', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Business Features', 'Branding', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Business Features', 'Automations', 'N', 'N', 'Y', 'Y', 'Y'],
  ['Business Features', 'Locations / Multi-Shop', 'N', 'N', 'N', 'Y', 'Y'],
  ['Business Features', 'Revenue Analytics', 'N', 'N', 'N', 'Y', 'Y'],
  ['Business Features', 'Priority Support', 'N', 'N', 'N', 'Y', 'Y'],
  ['Enterprise Features', 'Integrations', 'N', 'N', 'N', 'N', 'Y'],
  ['Enterprise Features', 'API Keys', 'N', 'N', 'N', 'N', 'Y'],
  ['Enterprise Features', 'Webhooks', 'N', 'N', 'N', 'N', 'Y'],
  ['Enterprise Features', 'Custom Integrations', 'N', 'N', 'N', 'N', 'Y'],
  ['Enterprise Features', 'Unlimited Shops', 'N', 'N', 'N', 'N', 'Y'],
  ['Enterprise Features', 'SLA Guarantees', 'N', 'N', 'N', 'N', 'Y'],
  ['Enterprise Features', 'White Label', 'N', 'N', 'N', 'N', 'Y'],
  ['Enterprise Features', 'Dedicated Support', 'N', 'N', 'N', 'N', 'Y'],
];

const notes = [
  'This matrix reflects the current subscription definitions in src/lib/subscription.ts and route gating in src/lib/subscription-access.ts.',
  'Manager and technician workflows depend on multi-role access, which begins on Growth.',
  'Starter is limited to a single user and a single shop.',
];

const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

doc.setFont('helvetica', 'bold');
doc.setFontSize(18);
doc.text('FixTray Subscription Services Matrix', 40, 40);

doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
doc.text('Full app service list with subscription access by plan.', 40, 74);

autoTable(doc, {
  startY: 92,
  head: [['Plan', 'Price / Month', 'Max Users', 'Max Shops']],
  body: planSummary,
  theme: 'grid',
  styles: { fontSize: 9, cellPadding: 5 },
  headStyles: { fillColor: [32, 64, 96] },
  margin: { left: 40, right: 40 },
});

autoTable(doc, {
  startY: doc.lastAutoTable.finalY + 18,
  head: [['Category', 'Service', 'Starter', 'Growth', 'Professional', 'Business', 'Enterprise']],
  body: serviceRows,
  theme: 'striped',
  styles: { fontSize: 7, cellPadding: 4, overflow: 'linebreak' },
  headStyles: { fillColor: [24, 120, 92] },
  columnStyles: {
    0: { cellWidth: 100 },
    1: { cellWidth: 190 },
    2: { halign: 'center', cellWidth: 60 },
    3: { halign: 'center', cellWidth: 60 },
    4: { halign: 'center', cellWidth: 78 },
    5: { halign: 'center', cellWidth: 60 },
    6: { halign: 'center', cellWidth: 72 },
  },
  margin: { left: 40, right: 40 },
  didParseCell(data) {
    if (data.section === 'body' && data.column.index >= 2) {
      const value = String(data.cell.raw);
      if (value === 'Y') {
        data.cell.styles.textColor = [14, 92, 47];
        data.cell.styles.fontStyle = 'bold';
      }
      if (value === 'N') {
        data.cell.styles.textColor = [148, 32, 32];
      }
    }
  },
});

const notesY = doc.lastAutoTable.finalY + 22;
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.text('Notes', 40, notesY);
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);

let lineY = notesY + 16;
for (const note of notes) {
  const wrapped = doc.splitTextToSize(`- ${note}`, 740);
  doc.text(wrapped, 46, lineY);
  lineY += wrapped.length * 12;
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));

console.log(`PDF generated at ${outputPath}`);