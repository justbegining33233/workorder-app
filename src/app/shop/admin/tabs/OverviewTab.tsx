'use client';

import Link from 'next/link';
import { FaBox, FaUser, FaClipboardList, FaCog, FaExclamationTriangle, FaUsers, FaChartBar, FaEnvelope, FaRedo, FaTools, FaPlusCircle, FaStore, FaKey, FaMapMarkerAlt } from 'react-icons/fa';
import MessagingCard from '@/components/MessagingCard';

type TabName = 'overview' | 'settings' | 'payroll' | 'team' | 'inventory';

interface OverviewTabProps {
  shopStats: any;
  inventoryStock: any[];
  budgetData: any;
  userId: string;
  shopId: string;
  getLiveHours: (emp: any) => number;
  setTab: (tab: TabName) => void;
}

export default function OverviewTab({
  shopStats,
  inventoryStock,
  budgetData,
  userId,
  shopId,
  getLiveHours,
  setTab,
}: OverviewTabProps) {
  if (!shopStats) {
    return (
      <div style={{ textAlign: 'center', padding: 64, color: '#9aa3b2' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}><FaCog /></div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>Loading shop statistics...</div>
        <div style={{ fontSize: 14 }}>Please wait while we fetch your data</div>
      </div>
    );
  }

  return (
    <div>
      {/* Key Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Link href="/workorders/list?from=admin" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: 20, cursor: 'pointer' }}>
            <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>Open Work Orders</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6' }}>{shopStats.workOrders.open}</div>
            <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>View All <FaClipboardList style={{fontSize:13,verticalAlign:'middle'}}/></div>
          </div>
        </Link>
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>Completed Today</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e' }}>{shopStats.workOrders.completedToday}</div>
        </div>
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>Today's Revenue</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e' }}>${(shopStats.revenue?.today ?? 0).toFixed(2)}</div>
        </div>
        <div style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>This Week</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#a855f7' }}>${(shopStats.revenue?.week ?? 0).toFixed(2)}</div>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>Team Members</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{shopStats.team.total}</div>
          <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>{shopStats.team.clockedIn} clocked in</div>
        </div>
        <div style={{ background: 'rgba(229,51,42,0.1)', border: '1px solid rgba(229,51,42,0.3)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>Pending Actions</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#e5332a' }}>
            {shopStats.workOrders.pendingApprovals + shopStats.inventory.pendingRequests}
          </div>
          <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>
            {shopStats.workOrders.pendingApprovals} orders, {shopStats.inventory.pendingRequests} inventory
          </div>
        </div>
        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>Inventory Items</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#6366f1' }}>{inventoryStock.length}</div>
          <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>
            {inventoryStock.filter((item: any) => item.quantity <= item.reorderPoint).length} low stock
          </div>
        </div>
      </div>

      {/* Inventory Summary Card */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 24 }}><FaBox /></div>
            <div>
              <h3 style={{ color: '#e5e7eb', fontSize: 18, margin: 0 }}>Current Inventory</h3>
              <div style={{ color: '#9aa3b2', fontSize: 13 }}>Parts and supplies in stock</div>
            </div>
          </div>
          <button
            onClick={() => setTab('inventory')}
            style={{ padding: '8px 16px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#6366f1', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            + Add Inventory
          </button>
        </div>

        {inventoryStock.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9aa3b2' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}><FaBox /></div>
            <div>No inventory items yet</div>
            <div style={{ fontSize: 13 }}>Click &quot;Add Inventory&quot; to start tracking parts and supplies</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>Total Value</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                  ${inventoryStock.reduce((sum: number, item: any) => sum + (item.quantity * item.sellingPrice), 0).toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>
                  {inventoryStock.reduce((sum: number, item: any) => sum + item.quantity, 0)} total units
                </div>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>Low Stock Items</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
                  {inventoryStock.filter((item: any) => item.quantity <= item.reorderPoint).length}
                </div>
                <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>Need reorder</div>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>Suppliers</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>
                  {new Set(inventoryStock.filter((item: any) => item.supplier).map((item: any) => item.supplier)).size}
                </div>
                <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>Active vendors</div>
              </div>
              <div style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>Categories</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#a855f7' }}>
                  {new Set(inventoryStock.filter((item: any) => item.category).map((item: any) => item.category)).size}
                </div>
                <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>Item types</div>
              </div>
            </div>

            {/* Quick View Table */}
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, overflow: 'hidden', maxHeight: 300, overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13 }}>
                <thead style={{ background: 'rgba(0,0,0,0.3)', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: 12, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Item</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>SKU</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Quantity</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Cost/Sell</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Supplier</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryStock.slice(0, 10).map((item: any) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, color: '#e5e7eb' }}>{item.itemName}</td>
                      <td style={{ padding: 12, color: '#9aa3b2' }}>{item.sku || '-'}</td>
                      <td style={{ padding: 12, color: item.quantity <= item.reorderPoint ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>{item.quantity}</td>
                      <td style={{ padding: 12, color: '#9aa3b2', fontSize: 12 }}>
                        <div>${item.unitCost?.toFixed(2) || '0.00'}</div>
                        <div style={{ color: '#60a5fa' }}>${item.sellingPrice?.toFixed(2) || '0.00'}</div>
                      </td>
                      <td style={{ padding: 12, color: '#9aa3b2' }}>{item.supplier || '-'}</td>
                      <td style={{ padding: 12 }}>
                        {item.quantity <= item.reorderPoint ? (
                          <span style={{ padding: '4px 8px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>LOW STOCK</span>
                        ) : (
                          <span style={{ padding: '4px 8px', background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 4, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>IN STOCK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {inventoryStock.length > 10 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button
                  onClick={() => setTab('inventory')}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#6366f1', fontSize: 13, cursor: 'pointer' }}
                >
                  View All {inventoryStock.length} Items <FaClipboardList style={{fontSize:13,verticalAlign:'middle'}}/>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Parts and Set Labor (overview) */}
      <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>Parts and Set Labor</div>
            <div style={{ fontSize: 12, color: '#9aa3b2' }}>Quick glance at stock and labor items</div>
          </div>
          <span style={{ padding: '4px 10px', background: 'rgba(229,51,42,0.2)', color: '#e5332a', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
            {inventoryStock.filter((item: any) => item.quantity <= (item.reorderPoint || 0)).length} Alerts
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {inventoryStock.slice(0, 6).map((item: any, idx: number) => {
            const critical = item.quantity <= (item.reorderPoint || 0) / 2;
            const low = item.quantity <= (item.reorderPoint || 0) && !critical;
            const border = critical ? 'rgba(229,51,42,0.3)' : low ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.12)';
            const text = critical ? '#e5332a' : low ? '#f59e0b' : '#22c55e';
            const badgeBg = critical ? 'rgba(229,51,42,0.18)' : low ? 'rgba(245,158,11,0.18)' : 'rgba(34,197,94,0.18)';
            const badgeLabel = critical ? 'Critical' : low ? 'Low' : 'Good';
            return (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${border}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{item.itemName || 'Part'}</div>
                  <span style={{ padding: '3px 8px', background: badgeBg, color: text, borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{badgeLabel}</span>
                </div>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 6 }}>SKU: {item.sku || ''}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9aa3b2' }}>On Hand</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: text }}>{item.quantity}</div>
                </div>
                <div style={{ fontSize: 11, color: '#9aa3b2' }}>Reorder at: {item.reorderPoint ?? 0}</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <Link href="/shop/parts-labor">
            <button style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Open Parts &amp; Labor ?
            </button>
          </Link>
          <button
            onClick={() => setTab('inventory')}
            style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Go to Inventory ?
          </button>
        </div>
      </div>

      {/* Shop Communications - MessagingCard */}
      <div style={{ marginBottom: 24 }}>
        <MessagingCard userId={userId} shopId={shopId} />
      </div>

      {/* Budget Tracking */}
      {budgetData && (budgetData.weeklyBudget > 0 || budgetData.monthlyBudget > 0) && (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 24 }}><FaExclamationTriangle /></div>
            <div>
              <h3 style={{ color: '#e5e7eb', fontSize: 18, margin: 0 }}>Payroll Budget Tracking</h3>
              <div style={{ color: '#9aa3b2', fontSize: 13 }}>Monitor spending against budget limits</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {budgetData.weeklyBudget > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>Weekly Budget</span>
                  <span style={{ color: budgetData.weeklySpent > budgetData.weeklyBudget ? '#ef4444' : budgetData.weeklySpent / budgetData.weeklyBudget > 0.9 ? '#f59e0b' : '#22c55e', fontSize: 14, fontWeight: 600 }}>
                    ${(budgetData.weeklySpent ?? 0).toFixed(2)} / ${(budgetData.weeklyBudget ?? 0).toFixed(2)}
                  </span>
                </div>
                <div style={{ width: '100%', height: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${Math.min(100, (budgetData.weeklySpent / budgetData.weeklyBudget) * 100)}%`, height: '100%', background: budgetData.weeklySpent > budgetData.weeklyBudget ? 'linear-gradient(90deg, #ef4444, #dc2626)' : budgetData.weeklySpent / budgetData.weeklyBudget > 0.9 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #22c55e, #16a34a)', transition: 'width 0.3s ease' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {Math.min(100, Math.round((budgetData.weeklySpent / budgetData.weeklyBudget) * 100))}%
                  </div>
                </div>
                {budgetData.weeklySpent > budgetData.weeklyBudget && (
                  <div style={{ marginTop: 8, padding: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span><FaExclamationTriangle /></span>
                    <span>Over budget by ${((budgetData.weeklySpent ?? 0) - (budgetData.weeklyBudget ?? 0)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {budgetData.monthlyBudget > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>Monthly Budget</span>
                  <span style={{ color: budgetData.monthlySpent > budgetData.monthlyBudget ? '#ef4444' : budgetData.monthlySpent / budgetData.monthlyBudget > 0.9 ? '#f59e0b' : '#22c55e', fontSize: 14, fontWeight: 600 }}>
                    ${(budgetData.monthlySpent ?? 0).toFixed(2)} / ${(budgetData.monthlyBudget ?? 0).toFixed(2)}
                  </span>
                </div>
                <div style={{ width: '100%', height: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${Math.min(100, (budgetData.monthlySpent / budgetData.monthlyBudget) * 100)}%`, height: '100%', background: budgetData.monthlySpent > budgetData.monthlyBudget ? 'linear-gradient(90deg, #ef4444, #dc2626)' : budgetData.monthlySpent / budgetData.monthlyBudget > 0.9 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #22c55e, #16a34a)', transition: 'width 0.3s ease' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {Math.min(100, Math.round((budgetData.monthlySpent / budgetData.monthlyBudget) * 100))}%
                  </div>
                </div>
                {budgetData.monthlySpent > budgetData.monthlyBudget && (
                  <div style={{ marginTop: 8, padding: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span><FaExclamationTriangle /></span>
                    <span>Over budget by ${((budgetData.monthlySpent ?? 0) - (budgetData.monthlyBudget ?? 0)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {(budgetData.weeklySpent > budgetData.weeklyBudget || budgetData.monthlySpent > budgetData.monthlyBudget) && (
            <div style={{ marginTop: 20, padding: 16, background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32 }}><FaExclamationTriangle /></div>
              <div>
                <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Budget Alert: Payroll Spending Exceeded</div>
                <div style={{ color: '#e5e7eb', fontSize: 13 }}>Review your payroll expenses and consider adjusting team schedules or budget limits.</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Currently Clocked In */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 24 }}>?</div>
            <div>
              <h3 style={{ color: '#e5e7eb', fontSize: 18, margin: 0 }}>Currently Clocked In</h3>
              <div style={{ color: '#9aa3b2', fontSize: 13 }}>{shopStats.team.clockedIn} employees working</div>
            </div>
          </div>

          {shopStats.team.currentlyWorking.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#9aa3b2' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}><FaUser /></div>
              <div>No one currently clocked in</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {shopStats.team.currentlyWorking.map((emp: any) => (
                <div key={emp.id} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                      {emp.role === 'manager' ? <FaUser /> : <FaUser />}
                    </div>
                    <div>
                      <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 14 }}>{emp.name}</div>
                      <div style={{ color: '#9aa3b2', fontSize: 12 }}>
                        Clocked in at {new Date(emp.clockedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>{getLiveHours(emp).toFixed(1)}h</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 24 }}>?</div>
            <div>
              <h3 style={{ color: '#e5e7eb', fontSize: 18, margin: 0 }}>Quick Actions</h3>
              <div style={{ color: '#9aa3b2', fontSize: 13 }}>Common tasks and shortcuts</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { href: '/shop/manage-team', bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.3)', color: '#3b82f6', icon: <FaUsers />, label: 'Manage Team', sub: 'Add or edit team members' },
              { href: '/shop/reports', bg: 'rgba(34,197,94,0.2)', border: 'rgba(34,197,94,0.3)', color: '#22c55e', icon: <FaClipboardList />, label: 'Payroll & Reports', sub: 'Download employee hours report' },
              { href: '/shop/admin/settings', bg: 'rgba(168,85,247,0.2)', border: 'rgba(168,85,247,0.3)', color: '#a855f7', icon: <FaCog />, label: 'Shop Settings', sub: 'Configure rates and margins' },
              { href: '/shop/templates', bg: 'rgba(251,191,36,0.2)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24', icon: <FaClipboardList />, label: 'Work Order Templates', sub: 'Save common job configurations' },
              { href: '/shop/vendors', bg: 'rgba(139,92,246,0.2)', border: 'rgba(139,92,246,0.3)', color: '#a78bfa', icon: <FaStore />, label: 'Vendor Management', sub: 'Manage parts suppliers' },
              { href: '/shop/locations', bg: 'rgba(20,184,166,0.2)', border: 'rgba(20,184,166,0.3)', color: '#2dd4bf', icon: <FaMapMarkerAlt />, label: 'Shop Locations', sub: 'Manage multiple branches' },
              { href: '/shop/settings/two-factor', bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.3)', color: '#60a5fa', icon: <FaKey />, label: 'Two-Factor Auth (2FA)', sub: 'Secure your account' },
              { href: '/shop/analytics', bg: 'rgba(236,72,153,0.2)', border: 'rgba(236,72,153,0.3)', color: '#ec4899', icon: <FaChartBar />, label: 'Shop Analytics', sub: 'Performance & revenue trends' },
              { href: '/shop/customer-messages', bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.3)', color: '#3b82f6', icon: <FaEnvelope />, label: 'Customer Messages', sub: 'All customer conversations' },
              { href: '/shop/recurring-workorders', bg: 'rgba(34,197,94,0.2)', border: 'rgba(34,197,94,0.3)', color: '#22c55e', icon: <FaRedo />, label: 'Recurring Jobs', sub: 'Manage scheduled services' },
              { href: '/shop/services', bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b', icon: <FaTools />, label: 'Services', sub: 'Configure offered services' },
              { href: '/shop/new-inshop-job', bg: 'rgba(229,51,42,0.2)', border: 'rgba(229,51,42,0.3)', color: '#e5332a', icon: <FaPlusCircle />, label: 'New In-Shop Job', sub: 'Create a walk-in work order' },
            ].map(({ href, bg, border, color, icon, label, sub }) => (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: 16, background: bg, border: `1px solid ${border}`, borderRadius: 8, color, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <div>
                    <div>{label}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{sub}</div>
                  </div>
                </button>
              </Link>
            ))}

            {shopStats.inventory.pendingRequests > 0 && (
              <Link href="/shop/home" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: 16, background: 'rgba(229,51,42,0.2)', border: '1px solid rgba(229,51,42,0.3)', borderRadius: 8, color: '#e5332a', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}><FaExclamationTriangle /></span>
                    <div>
                      <div>Pending Inventory Requests</div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>Requires approval</div>
                    </div>
                  </div>
                  <div style={{ padding: '4px 12px', background: '#e5332a', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                    {shopStats.inventory.pendingRequests}
                  </div>
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
