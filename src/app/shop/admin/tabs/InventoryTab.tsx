'use client';

interface InventoryTabProps {
  showLowStockOnly: boolean;
  setShowLowStockOnly: (v: boolean) => void;
  inventoryStock: any[];
  inventoryRequests: any[];
  purchaseOrders: any[];
  poForm: any;
  setPoForm: (f: any) => void;
  showPoModal: boolean;
  setShowPoModal: (v: boolean) => void;
  workOrderOptions: any[];
  loadingWorkOrders: boolean;
  shopId: string;
  fetchInventoryStock: (id: string) => void;
  fetchInventoryRequests: (id: string) => void;
  handleCreatePurchaseOrder: () => void;
  handleReceivePurchaseOrder: (id: string) => void;
}

export default function InventoryTab({
  showLowStockOnly,
  setShowLowStockOnly,
  inventoryStock,
  inventoryRequests,
  purchaseOrders,
  poForm,
  setPoForm,
  showPoModal,
  setShowPoModal,
  workOrderOptions,
  loadingWorkOrders,
  shopId,
  fetchInventoryStock,
  fetchInventoryRequests,
  handleCreatePurchaseOrder,
  handleReceivePurchaseOrder,
}: InventoryTabProps) {
  return (
    <div>
      {/* Header with Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#e5e7eb', fontSize: 24, margin: 0 }}>?? Inventory Management</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e5e7eb', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={(e) => {
              setShowLowStockOnly(e.target.checked);
              fetchInventoryStock(shopId);
            }}
          />
          Show Low Stock Only
        </label>
      </div>

      {/* Purchase Orders */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: '#e5e7eb', fontSize: 18, margin: 0 }}>Purchase Orders</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: '#9aa3b2', fontSize: 12 }}>{purchaseOrders.length} total</div>
            <button
              onClick={() => setShowPoModal(true)}
              style={{ padding: '8px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              + New PO
            </button>
          </div>
        </div>

        {/* PO Creation Modal */}
        {showPoModal && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowPoModal(false)}
          >
            <div
              style={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: '100%', maxWidth: 560, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ color: '#e5e7eb', fontSize: 20, margin: 0, fontWeight: 700 }}>Create Purchase Order</h3>
                <button onClick={() => setShowPoModal(false)} style={{ background: 'none', border: 'none', color: '#9aa3b2', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>?</button>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#fbbf24' }}>
                ?? Customer approval is required before ordering. The PO will be flagged <strong>Awaiting Approval</strong> until the customer confirms.
              </div>
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: '#9aa3b2', fontSize: 12, fontWeight: 600 }}>Vendor (optional)</span>
                  <input
                    type="text"
                    value={poForm.vendor}
                    onChange={(e) => setPoForm({ ...poForm, vendor: e.target.value })}
                    placeholder="e.g. AutoZone"
                    style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#e5e7eb', fontSize: 14 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: '#9aa3b2', fontSize: 12, fontWeight: 600 }}>Item Name *</span>
                  <input
                    type="text"
                    value={poForm.itemName}
                    onChange={(e) => setPoForm({ ...poForm, itemName: e.target.value })}
                    placeholder="e.g. Brake Pads"
                    style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#e5e7eb', fontSize: 14 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: '#9aa3b2', fontSize: 12, fontWeight: 600 }}>Quantity</span>
                  <input
                    type="number"
                    min={1}
                    value={poForm.quantity}
                    onChange={(e) => setPoForm({ ...poForm, quantity: Number(e.target.value) })}
                    style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#e5e7eb', fontSize: 14 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: '#9aa3b2', fontSize: 12, fontWeight: 600 }}>Unit Cost ($)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={poForm.unitCost}
                    onChange={(e) => setPoForm({ ...poForm, unitCost: Number(e.target.value) })}
                    style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#e5e7eb', fontSize: 14 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                <span style={{ color: '#9aa3b2', fontSize: 12, fontWeight: 600 }}>Link to Work Order (optional)</span>
                <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, background: 'rgba(0,0,0,0.3)' }}>
                  {loadingWorkOrders ? (
                    <div style={{ color: '#9aa3b2', fontSize: 12, padding: 10 }}>Loading work orders...</div>
                  ) : workOrderOptions.length === 0 ? (
                    <div style={{ color: '#9aa3b2', fontSize: 12, padding: 10 }}>No open work orders</div>
                  ) : (
                    workOrderOptions.map((wo: any) => (
                      <div
                        key={wo.id}
                        onClick={() => setPoForm({ ...poForm, workOrderId: wo.id })}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          color: poForm.workOrderId === wo.id ? '#22c55e' : '#e5e7eb',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          fontSize: 13,
                          background: poForm.workOrderId === wo.id ? 'rgba(34,197,94,0.1)' : 'transparent',
                        }}
                      >
                        {wo.id.slice(-6)}  {wo.status}  {wo.issueDescription?.symptoms || ''}
                        {poForm.workOrderId === wo.id && ' ?'}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowPoModal(false)}
                  style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.08)', color: '#e5e7eb', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePurchaseOrder}
                  style={{ padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Create PO  Awaiting Approval
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List of POs */}
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, background: 'rgba(0,0,0,0.35)', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(90deg,#38bdf8,#6366f1)', color: 'white', padding: '10px 14px', fontWeight: 700, letterSpacing: 0.25 }}>
            Existing Purchase Orders
          </div>
          <div style={{ padding: 12, display: 'grid', gap: 12 }}>
            {purchaseOrders.length === 0 ? (
              <div style={{ color: '#9aa3b2', fontSize: 13 }}>No purchase orders yet.</div>
            ) : (
              purchaseOrders.map((po) => {
                const bannerColor = po.status === 'received' ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#3b82f6,#1d4ed8)';
                return (
                  <div key={po.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, background: 'rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                    <div style={{ background: bannerColor, color: 'white', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                      <div>PO-{po.id.slice(-6)} {po.vendor ? ` ${po.vendor}` : ''}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                          {po.status.toUpperCase()}
                        </span>
                        {po.customerApprovalStatus === 'pending' && (
                          <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(245,158,11,0.25)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)' }}>
                            ? AWAITING APPROVAL
                          </span>
                        )}
                        {po.customerApprovalStatus === 'approved' && (
                          <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                            ? CUSTOMER APPROVED
                          </span>
                        )}
                        {po.customerApprovalStatus === 'rejected' && (
                          <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                            ? CUSTOMER REJECTED
                          </span>
                        )}
                        {po.status !== 'received' && (
                          <button
                            onClick={() => handleReceivePurchaseOrder(po.id)}
                            style={{ padding: '6px 12px', background: '#0ea5e9', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Mark Received
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: 12 }}>
                      <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 6 }}>
                        Vendor: {po.vendor || 'N/A'}  Items: {po.items?.length || 0}  Created: {new Date(po.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {po.items?.map((item: any) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: 13 }}>
                            <span>{item.itemName} (x{item.quantity})</span>
                            <span>${(item.unitCost || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Pending Requests Section */}
      {inventoryRequests.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: '#ef4444', fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>??</span>
            Pending Inventory Requests ({inventoryRequests.length})
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {inventoryRequests.map((request: any) => (
              <div
                key={request.id}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                    {request.itemName} (x{request.quantity})
                  </div>
                  <div style={{ color: '#9aa3b2', fontSize: 13 }}>
                    Requested by: {request.requesterName}  {request.reason || 'No reason provided'}
                  </div>
                  <div style={{ color: '#9aa3b2', fontSize: 12, marginTop: 4 }}>
                    Urgency: <span style={{ color: request.urgency === 'urgent' ? '#ef4444' : request.urgency === 'high' ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>{request.urgency}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('token');
                      await fetch('/api/shop/inventory-requests', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ requestId: request.id, status: 'approved', approvedBy: localStorage.getItem('userId') }),
                      });
                      fetchInventoryRequests(shopId);
                      fetchInventoryStock(shopId);
                    }}
                    style={{ padding: '8px 16px', background: '#22c55e', border: 'none', borderRadius: 6, color: 'white', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ? Approve
                  </button>
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('token');
                      await fetch('/api/shop/inventory-requests', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ requestId: request.id, status: 'denied', approvedBy: localStorage.getItem('userId') }),
                      });
                      fetchInventoryRequests(shopId);
                    }}
                    style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ? Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Stock Table */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Item Name</th>
                <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>SKU</th>
                <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Category</th>
                <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Quantity</th>
                <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Reorder Point</th>
                <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Unit Cost</th>
                <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Location</th>
                <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventoryStock.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#9aa3b2' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>??</div>
                    <div>No inventory items found</div>
                    <div style={{ fontSize: 13, marginTop: 8 }}>Add items using the API or import from CSV</div>
                  </td>
                </tr>
              ) : (
                inventoryStock.map((item: any) => {
                  const isLowStock = item.quantity <= item.reorderPoint;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isLowStock ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                      <td style={{ padding: 16, color: '#e5e7eb', fontWeight: 600 }}>{item.itemName}</td>
                      <td style={{ padding: 16, color: '#9aa3b2', fontSize: 13 }}>{item.sku || '-'}</td>
                      <td style={{ padding: 16, color: '#9aa3b2', fontSize: 13 }}>{item.category || '-'}</td>
                      <td style={{ padding: 16, textAlign: 'center', color: isLowStock ? '#ef4444' : '#e5e7eb', fontWeight: 700 }}>{item.quantity}</td>
                      <td style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13 }}>{item.reorderPoint}</td>
                      <td style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13 }}>${item.unitCost?.toFixed(2) || '0.00'}</td>
                      <td style={{ padding: 16, color: '#9aa3b2', fontSize: 13 }}>{item.location || '-'}</td>
                      <td style={{ padding: 16, textAlign: 'center' }}>
                        {isLowStock ? (
                          <span style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#ef4444', fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
                            ?? LOW STOCK
                          </span>
                        ) : (
                          <span style={{ padding: '4px 12px', background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, color: '#22c55e', fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
                            ? IN STOCK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Inventory Note */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <div style={{ color: '#9aa3b2', fontSize: 13 }}>
          To add new inventory items, use the <strong>POST /api/shop/inventory-stock</strong> endpoint or import from CSV
        </div>
      </div>
    </div>
  );
}
