'use client';

interface PayrollTabProps {
  payrollData: any;
  loading: boolean;
  payrollStartDate: string;
  payrollEndDate: string;
  setPayrollStartDate: (d: string) => void;
  setPayrollEndDate: (d: string) => void;
  generatingPDF: boolean;
  handleRefreshPayroll: () => void;
  downloadPayrollCSV: () => void;
  downloadPayrollPDF: () => void;
}

export default function PayrollTab({
  payrollData,
  loading,
  payrollStartDate,
  payrollEndDate,
  setPayrollStartDate,
  setPayrollEndDate,
  generatingPDF,
  handleRefreshPayroll,
  downloadPayrollCSV,
  downloadPayrollPDF,
}: PayrollTabProps) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#e5e7eb', fontSize: 24, margin: 0 }}>?? Payroll Report</h2>
          <div style={{ color: '#9aa3b2', fontSize: 13, marginTop: 4 }}>Live view  Updates every 5 seconds</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleRefreshPayroll}
            disabled={loading}
            style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}
          >
            {loading ? '? Refreshing...' : '?? Refresh Now'}
          </button>
          {payrollData && payrollData.employees.length > 0 && (
            <>
              <button
                onClick={downloadPayrollCSV}
                style={{ padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                ?? Download CSV
              </button>
              <button
                onClick={downloadPayrollPDF}
                disabled={generatingPDF}
                style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: generatingPDF ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                {generatingPDF ? 'Generating...' : '?? Download PDF'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Date Range Picker */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 8 }}>
        <div>
          <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>Start Date</label>
          <input
            type="date"
            value={payrollStartDate}
            onChange={(e) => setPayrollStartDate(e.target.value)}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
          />
        </div>
        <div>
          <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>End Date</label>
          <input
            type="date"
            value={payrollEndDate}
            onChange={(e) => setPayrollEndDate(e.target.value)}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
          />
        </div>
      </div>

      {(!payrollData || payrollData.employees.length === 0) && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>?</div>
          <div style={{ color: '#9aa3b2', fontSize: 16 }}>No completed time entries found</div>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>
            Time entries will appear here once employees clock out
          </div>
        </div>
      )}

      {payrollData && payrollData.employees.length > 0 && (
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#9aa3b2', fontSize: 12 }}>Total Employees</div>
                <div style={{ color: '#e5e7eb', fontSize: 24, fontWeight: 700 }}>{payrollData.summary.totalEmployees}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#9aa3b2', fontSize: 12 }}>Total Hours</div>
                <div style={{ color: '#3b82f6', fontSize: 24, fontWeight: 700 }}>{(payrollData.summary?.totalHours ?? 0).toFixed(1)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#9aa3b2', fontSize: 12 }}>Total Payroll</div>
                <div style={{ color: '#22c55e', fontSize: 24, fontWeight: 700 }}>${(payrollData.summary?.totalPayroll ?? 0).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 14 }}>
              <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                <tr>
                  <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Employee</th>
                  <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontWeight: 600 }}>Total Hours</th>
                  <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontWeight: 600 }}>Rate</th>
                  <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontWeight: 600 }}>Total Pay</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.employees.map((emp: any) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: 16, color: '#e5e7eb', fontWeight: 600 }}>{emp.name}</td>
                    <td style={{ padding: 16, color: '#9aa3b2' }}>
                      {emp.role === 'manager' ? '?? Manager' : '?? Tech'}
                    </td>
                    <td style={{ padding: 16, textAlign: 'center', color: '#3b82f6', fontWeight: 600 }}>
                      {(emp.totalHours ?? 0).toFixed(1)}
                    </td>
                    <td style={{ padding: 16, textAlign: 'center', color: '#9aa3b2' }}>${emp.hourlyRate || 0}</td>
                    <td style={{ padding: 16, textAlign: 'center', color: '#22c55e', fontWeight: 700, fontSize: 16 }}>
                      ${(emp.totalPay ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
