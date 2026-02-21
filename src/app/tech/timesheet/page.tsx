'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';

import { useRequireAuth } from '@/contexts/AuthContext';

function formatTime(dt?: string | Date | null) {
  if (!dt) return '-';
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function fmtDurationMs(ms: number) {
  if (ms < 0) ms = 0;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function TechTimesheet() {
  const { user, isLoading } = useRequireAuth(['tech', 'manager']);
  const [entries, setEntries] = useState<any[]>([]);
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(false);
  const refreshRef = useRef<number | null>(null);

  // --- Work-order assignment / job-time UI state
  const [assigningEntryId, setAssigningEntryId] = useState<string | null>(null);
  const [woInputs, setWoInputs] = useState<Record<string, string>>({});


  // edit state for inline row editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({ notes: '', workOrderId: '' });



  useEffect(() => {
    if (user) fetchEntries();
    // refresh every 20s so active timers update
    refreshRef.current = window.setInterval(() => { if (user) fetchEntries(false); }, 20000);
    return () => { if (refreshRef.current) window.clearInterval(refreshRef.current); };
     
  }, [user, range]);

  const getRangeDates = () => {
    const now = new Date();
    if (range === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay()); // Sunday
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
      return { start, end };
    }

    // month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0,0,0,0);
    const end = new Date(now.getFullYear(), now.getMonth()+1, 0);
    end.setHours(23,59,59,999);
    return { start, end };
  };

  const fetchEntries = async (showLoading = true) => {
    if (!user) return;
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem('token');
      const { start, end } = getRangeDates();
      const res = await fetch(`/api/time-tracking?techId=${user.id}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { timeEntries } = await res.json();
        setEntries(timeEntries || []);
      } else {
        console.error('Failed to load time entries');
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const totals = useMemo(() => {
    let totalMs = 0;
    const now = new Date();

    entries.forEach((e) => {
      if (e.clockOut) {
        const ms = (new Date(e.clockOut).getTime() - new Date(e.clockIn).getTime());
        totalMs += ms;
      } else {
        // active entry - count up to now
        totalMs += (now.getTime() - new Date(e.clockIn).getTime());
      }
    });

    // Total clocked-in hours (pay)
    let totalHours = 0;
    if (entries.length && entries.every(e => e.hoursWorked !== null && e.hoursWorked !== undefined)) {
      totalHours = entries.reduce((acc, e) => acc + (e.hoursWorked || ((e.clockOut ? (new Date(e.clockOut).getTime() - new Date(e.clockIn).getTime())/(1000*60*60) : (now.getTime() - new Date(e.clockIn).getTime())/(1000*60*60)))), 0);
    } else {
      totalHours = totalMs / (1000*60*60);
    }

    // Billable hours = sum of hours linked to a workOrderId
    const billableHours = entries.reduce((acc, e) => {
      if (!e.workOrderId) return acc;
      const ci = new Date(e.clockIn).getTime();
      const co = e.clockOut ? new Date(e.clockOut).getTime() : now.getTime();
      return acc + ((co - ci) / (1000*60*60));
    }, 0);

    const nonBillableHours = Math.max(0, totalHours - billableHours);

    const hourly = (user as any)?.hourlyRate || 0;
    const billableEst = billableHours * hourly;

    return { totalHours, billableHours, nonBillableHours, billableEst };
  }, [entries, user]);

  const downloadCsv = () => {
    const rows = [ ['Date','Clock In','Clock Out','Duration (hh:mm:ss)','Hours','Notes'] ];
    entries.forEach(e => {
      const date = new Date(e.clockIn).toISOString().split('T')[0];
      const clockIn = formatTime(e.clockIn);
      const clockOut = e.clockOut ? formatTime(e.clockOut) : '—';
      const durationMs = e.clockOut ? (new Date(e.clockOut).getTime() - new Date(e.clockIn).getTime()) : (Date.now() - new Date(e.clockIn).getTime());
      const duration = fmtDurationMs(durationMs);
      const hours = e.hoursWorked ?? (durationMs / (1000*60*60));
      rows.push([date, clockIn, clockOut, duration, hours.toFixed(2), (e.notes || '')]);
    });

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet_${user?.id || 'me'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPayrollCsv = () => {
    if (!user) return;
    // Compute weekly totals, split regular/overtime (40h threshold)
    const rows = [ ['Employee','Week Start','Week End','Regular Hours','Overtime Hours','Hourly Rate','Regular Pay','Overtime Pay','Total Pay'] ];
    const weekHours = totals.totalHours;
    const regularHours = Math.min(40, weekHours);
    const overtimeHours = Math.max(0, weekHours - 40);
    const rate = (user as any)?.hourlyRate || 0;
    const overtimeMultiplier = 1.5; // default; shop setting not loaded here
    const regularPay = regularHours * rate;
    const overtimePay = overtimeHours * rate * overtimeMultiplier;
    const totalPay = regularPay + overtimePay;

    const { start, end } = getRangeDates();
    rows.push([`${user.name}`, start.toLocaleDateString(), end.toLocaleDateString(), regularHours.toFixed(2), overtimeHours.toFixed(2), rate.toFixed(2), regularPay.toFixed(2), overtimePay.toFixed(2), totalPay.toFixed(2)]);

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${user?.id || 'me'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPayroll = () => {
    if (!user) return;
    const { start, end } = getRangeDates();
    const html = `
      <html><head><title>Payroll ${start.toLocaleDateString()} - ${end.toLocaleDateString()}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#111}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ddd;text-align:left}</style>
      </head><body>
        <h2>Payroll — ${user.name}</h2>
        <div>${start.toLocaleDateString()} → ${end.toLocaleDateString()}</div>
        <table>
          <thead><tr><th>Regular Hours</th><th>Overtime Hours</th><th>Hourly Rate</th><th>Regular Pay</th><th>Overtime Pay</th><th>Total Pay</th></tr></thead>
          <tbody>
            <tr><td>${Math.min(40, totals.totalHours).toFixed(2)}</td><td>${Math.max(0, totals.totalHours - 40).toFixed(2)}</td><td>$${((user as any)?.hourlyRate||0).toFixed(2)}</td><td>$${(Math.min(40, totals.totalHours)*((user as any)?.hourlyRate||0)).toFixed(2)}</td><td>$${(Math.max(0, totals.totalHours - 40)*((user as any)?.hourlyRate||0)*1.5).toFixed(2)}</td><td>$${( (Math.min(40, totals.totalHours)*((user as any)?.hourlyRate||0)) + (Math.max(0, totals.totalHours - 40)*((user as any)?.hourlyRate||0)*1.5) ).toFixed(2)}</td></tr>
          </tbody>
        </table>
      </body></html>
    `;
    const w = window.open('', '_blank');
    if (!w) return alert('Unable to open print window');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  if (isLoading) {
    return (
      <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{color: '#e5e7eb', fontSize: 18}}>Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const { start, end } = getRangeDates();
  // Only show entries in the detailed table that are meaningful there.
  // Non‑billable / empty rows remain visible in the compact Pay Period table above.
  const detailedEntries = entries.filter(e => e.workOrderId || e.isPto || (e.notes && e.notes.toString().trim() !== ''));

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(245,158,11,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div>
            <Link href="/tech/all-tools" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:8, display:'inline-block'}}>
              ← Back to Tools
            </Link>
            <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>⏰ Time Tracking</h1>
            <p style={{fontSize:14, color:'#9aa3b2'}}>Track your work hours, breaks, and job time for payroll</p>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Range</div>
            <div style={{display:'flex', gap:8}}>
              <button onClick={() => setRange('week')} style={{padding:'8px 12px', borderRadius:8, background: range==='week'? '#111827':'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'#e5e7eb'}}>This Week</button>
              <button onClick={() => setRange('month')} style={{padding:'8px 12px', borderRadius:8, background: range==='month'? '#111827':'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'#e5e7eb'}}>This Month</button>
            </div>
            <div style={{fontSize:12, color:'#9aa3b2', marginTop:6}}>{start.toLocaleDateString()} → {end.toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:32, display:'grid', gridTemplateColumns: '1fr', gap:24}}>

          {/* Compact Hour Tracker (read-only) */}
          <div style={{marginBottom:8, padding:12, borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div style={{fontSize:12, color:'#9aa3b2'}}>Clocked-in (pay)</div>
              <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb'}}>{totals.totalHours.toFixed(2)} hrs</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:12, color:'#9aa3b2'}}>Billable</div>
              <div style={{fontSize:16, fontWeight:700, color:'#e5e7eb'}}>{totals.billableHours.toFixed(2)} hrs</div>
            </div>
          </div>

        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <div>
              <h3 style={{margin:0, color:'#e5e7eb'}}>Timesheet</h3>
              <div style={{fontSize:12, color:'#9aa3b2'}}>Pay period: <strong style={{color:'#e5e7eb'}}>{start.toLocaleDateString()} → {end.toLocaleDateString()}</strong></div>
            </div>

            <div style={{textAlign:'right'}}>
              <div style={{fontSize:12, color:'#9aa3b2'}}>Entries</div>
              <div style={{fontWeight:700, color:'#e5e7eb'}}>{entries.length} entries</div>
            </div>
          </div>

          <div style={{background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.04)', borderRadius:12, overflow:'hidden'}}>
            {/* Pay period summary */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.02)'}}>
              <div style={{fontSize:13, color:'#9aa3b2'}}>PAY PERIOD — <strong style={{color:'#e5e7eb'}}>{start.toLocaleDateString()} → {end.toLocaleDateString()}</strong></div>
              <div style={{fontSize:13, color:'#e5e7eb', fontWeight:700}}>TOTAL HOURS — {totals.totalHours.toFixed(2)} hrs</div>
            </div>

            {/* Compact pay-period table: Date | Clock In | Clock Out | Hours */}
            <div style={{padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.02)'}}>
              <div style={{display:'grid', gridTemplateColumns:'120px 100px 100px 80px', gap:8, fontSize:13, color:'#9aa3b2', marginBottom:6}}>
                <div>Date</div>
                <div>Clock In</div>
                <div>Clock Out</div>
                <div style={{textAlign:'right'}}>Hours</div>
              </div>

              {entries.length === 0 && (
                <div style={{padding:12, color:'#9aa3b2'}}>No time entries for this period.</div>
              )}

              {entries.map((pe) => {
                const ci = new Date(pe.clockIn);
                const co = pe.clockOut ? new Date(pe.clockOut) : null;
                const now = new Date();
                const durationMs = co ? (co.getTime() - ci.getTime()) : (now.getTime() - ci.getTime());
                const hours = pe.hoursWorked ?? (durationMs / (1000*60*60));

                return (
                  <div key={pe.id} style={{display:'grid', gridTemplateColumns:'120px 100px 100px 80px', padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.03)', alignItems:'center', color:'#e5e7eb'}}>
                    <div style={{fontSize:13, color:'#9aa3b2'}}>{ci.toLocaleDateString()}</div>
                    <div style={{fontWeight:600, fontFamily:'monospace'}}>{formatTime(ci)}</div>
                    <div style={{fontWeight:600, fontFamily:'monospace'}}>{co ? formatTime(co) : '—'}</div>
                    <div style={{textAlign:'right', fontWeight:700}}>{hours.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>



            <div>
              {loading && <div style={{padding:24, color:'#9aa3b2'}}>Loading...</div>}
              {!loading && entries.length === 0 && <div style={{padding:24, color:'#9aa3b2'}}>No time entries for this period.</div>}

              {/* If there are entries but none qualify for the detailed view, show a brief note */}


              {detailedEntries.length > 0 && detailedEntries.map((e) => {
                const clockIn = new Date(e.clockIn);
                const clockOut = e.clockOut ? new Date(e.clockOut) : null;
                const now = new Date();
                const durationMs = clockOut ? (clockOut.getTime() - clockIn.getTime()) : (now.getTime() - clockIn.getTime());
                const duration = fmtDurationMs(durationMs);
                const hours = e.hoursWorked ?? (durationMs / (1000*60*60));

                const isEditing = editingId === e.id;

                return (
                  <div key={e.id} style={{display:'grid', gridTemplateColumns:'120px 1fr 120px', padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.03)', alignItems:'center', fontSize:13, color:'#e5e7eb'}}>
                    {/* WO column */}
                    <div>
                      {isEditing ? (
                        <input value={editValues.workOrderId || ''} onChange={(ev) => setEditValues({...editValues, workOrderId: ev.target.value})} placeholder="WO id" style={{width:'100%', padding:6, borderRadius:6, border:'1px solid rgba(255,255,255,0.06)'}} />
                      ) : (
                        e.workOrderId ? (
                          <div style={{display:'flex', gap:8, alignItems:'center'}}>
                            <a href={`/workorders/${e.workOrderId}`} style={{color:'#3b82f6', fontWeight:700, textDecoration:'none'}}>{e.workOrderId}</a>
                            <span style={{fontSize:11, background:'#052e16', color:'#bbf7d0', padding:'2px 6px', borderRadius:999}}>Billable</span>
                          </div>
                        ) : (
                          <div style={{display:'flex', gap:8, alignItems:'center'}}>
                            <span style={{color:'#9aa3b2'}}>—</span>
                            <span style={{fontSize:11, background:'rgba(255,255,255,0.03)', color:'#e5e7eb', padding:'2px 6px', borderRadius:999}}>Non‑billable</span>
                          </div>
                        )
                      )}
                    </div>

                    {/* Notes column */}
                    <div style={{color:'#9aa3b2'}}>
                      {isEditing ? (
                        <input value={editValues.notes || ''} onChange={(ev) => setEditValues({...editValues, notes: ev.target.value})} placeholder="Notes" style={{width:'100%', padding:6, borderRadius:6, border:'1px solid rgba(255,255,255,0.06)'}} />
                      ) : (
                        e.notes || '—'
                      )}
                    </div>

                    {/* Hours / Actions column */}
                    <div style={{textAlign:'right', display:'flex', gap:8, alignItems:'center', justifyContent:'flex-end'}}>
                      <div style={{minWidth:110, textAlign:'right', display:'flex', gap:8, alignItems:'center', justifyContent:'flex-end'}}>
                        <div style={{fontWeight:700}}>{hours.toFixed(2)}</div>
                        {e.workOrderId ? (
                          <div style={{fontSize:11, color:'#bbf7d0', background:'#052e16', padding:'2px 6px', borderRadius:999}}>Billable</div>
                        ) : e.isPto ? (
                          <div style={{fontSize:11, color:'#fde68a', background:'#2b2110', padding:'2px 6px', borderRadius:999}}>PTO</div>
                        ) : (
                          <div style={{fontSize:11, color:'#9aa3b2', background:'rgba(255,255,255,0.03)', padding:'2px 6px', borderRadius:999}}>Non‑billable</div>
                        )}
                      </div>

                      {isEditing ? (
                        <>
                          <button onClick={async () => {
                            // Save
                            try {
                              const token = localStorage.getItem('token');
                              const res = await fetch(`/api/time-tracking/${e.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify(editValues),
                              });
                              if (res.ok) {
                                await fetchEntries();
                                setEditingId(null);
                                setEditValues({ notes: '', workOrderId: '' });
                              } else {
                                const { error } = await res.json();
                                alert(error || 'Failed to save');
                              }
                            } catch (err) {
                              console.error(err);
                              alert('Save failed');
                            }
                          }} style={{padding:'6px 8px', borderRadius:6, background:'#10b981', color:'white', border:'none'}}>Save</button>
                          <button onClick={() => { setEditingId(null); setEditValues({ notes: '', workOrderId: '' }); }} style={{padding:'6px 8px', borderRadius:6, background:'transparent', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.04)'}}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(e.id); setEditValues({ notes: e.notes || '', workOrderId: e.workOrderId || '' }); }} style={{padding:'0', borderRadius:4, background:'transparent', color:'#3b82f6', border:'none', fontSize:13, fontWeight:600, cursor:'pointer'}}>Edit</button>

                          {(user.role === 'manager' || user.role === 'admin') && (
                            <button onClick={async () => {
                              // Approve & lock entry
                              if (!confirm('Approve and lock this timesheet entry?')) return;
                              try {
                                const token = localStorage.getItem('token');
                                const res = await fetch(`/api/time-tracking/${e.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ approved: true, locked: true }),
                                });
                                if (res.ok) {
                                  await fetchEntries();
                                } else {
                                  const { error } = await res.json();
                                  alert(error || 'Failed to approve');
                                }
                              } catch (err) {
                                console.error(err);
                                alert('Approve failed');
                              }
                            }} style={{padding:'6px 8px', borderRadius:6, background:'#f59e0b', color:'#1f2937', border:'none'}}>Approve</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billable hours — separate table for WO-linked time */}
          <div style={{marginTop:16, background:'rgba(0,0,0,0.28)', border:'1px solid rgba(255,255,255,0.04)', borderRadius:12, overflow:'hidden'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.02)'}}>
              <div style={{fontSize:13, color:'#9aa3b2'}}>BILLABLE HOURS — <strong style={{color:'#e5e7eb'}}>{start.toLocaleDateString()} → {end.toLocaleDateString()}</strong></div>
              <div style={{fontSize:13, color:'#e5e7eb', fontWeight:700}}>{totals.billableHours.toFixed(2)} hrs</div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'120px 100px 100px 1fr', padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.03)', fontSize:13, color:'#9aa3b2'}}>
              <div>Date</div>
              <div>Clock In</div>
              <div>Clock Out</div>
              <div>WO#</div>
            </div>

            <div>
              {entries.filter(en => en.workOrderId).length === 0 && (
                <div style={{padding:16, color:'#9aa3b2'}}>No billable time entries for this period.</div>
              )}

              {entries.filter(en => en.workOrderId).map((be) => {
                const ci = new Date(be.clockIn);
                const co = be.clockOut ? new Date(be.clockOut) : null;
                return (
                  <div key={be.id} style={{display:'grid', gridTemplateColumns:'120px 100px 100px 1fr', padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.03)', alignItems:'center', color:'#e5e7eb'}}>
                    <div style={{fontSize:13, color:'#9aa3b2'}}>{ci.toLocaleDateString()}</div>
                    <div style={{fontWeight:600, fontFamily:'monospace'}}>{formatTime(ci)}</div>
                    <div style={{fontWeight:600, fontFamily:'monospace'}}>{co ? formatTime(co) : <span style={{color:'#f59e0b'}}>In progress</span>}</div>
                    <div><a href={`/workorders/${be.workOrderId}`} style={{color:'#3b82f6', fontWeight:700, textDecoration:'none'}}>{be.workOrderId}</a></div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
