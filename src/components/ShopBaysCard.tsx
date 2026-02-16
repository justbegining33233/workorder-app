"use client";

import { useEffect, useState } from "react";

interface WorkOrder {
  id: string;
  customer?: {
    firstName: string;
    lastName: string;
  };
  vehicleType: string;
  issueDescription: string;
  status: string;
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  bay?: number;
  createdAt: string;
  updatedAt: string;
}

interface Bay {
  id: number;
  workOrder?: WorkOrder;
  isOccupied: boolean;
}

interface ShopBaysCardProps {
  shopId: string;
}

interface Shop {
  capacity: number;
}

export default function ShopBaysCard({ shopId }: ShopBaysCardProps) {
  const [bays, setBays] = useState<Bay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopCapacity, setShopCapacity] = useState<number>(1);

  useEffect(() => {
    fetchBayData();
    const interval = setInterval(fetchBayData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [shopId]);

  const fetchBayData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token");
        return;
      }

      // Fetch shop data to get capacity
      const shopRes = await fetch(`/api/shops/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!shopRes.ok) {
        throw new Error("Failed to fetch shop data");
      }

      const shopData = await shopRes.json();
      const capacity = shopData.shop?.capacity || 1;
      setShopCapacity(capacity);

      // Fetch active work orders with bay assignments
      const workOrdersRes = await fetch(`/api/workorders?shopId=${shopId}&status=in_progress&status=pending&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!workOrdersRes.ok) {
        throw new Error("Failed to fetch work orders");
      }

      const workOrdersData = await workOrdersRes.json();
      const activeWorkOrders: WorkOrder[] = workOrdersData.workOrders || [];

      // Create bays array based on shop capacity
      const baysArray: Bay[] = [];
      for (let i = 1; i <= capacity; i++) {
        baysArray.push({
          id: i,
          isOccupied: false,
        });
      }

      // Assign work orders to bays
      activeWorkOrders.forEach((workOrder) => {
        const bayId = workOrder.bay;
        if (bayId && bayId >= 1 && bayId <= 999 && baysArray[bayId - 1]) {
          baysArray[bayId - 1].workOrder = workOrder;
          baysArray[bayId - 1].isOccupied = true;
        }
      });

      setBays(baysArray);
      setError(null);
    } catch (err) {
      console.error("Error fetching bay data:", err);
      setError("Failed to load bay data");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeSpent = (minutes?: number) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "#ef4444";
      case "high":
        return "#f97316";
      case "medium":
        return "#eab308";
      case "low":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div style={{
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        overflow: "hidden",
        padding: 20
      }}>
        <div style={{ textAlign: "center", color: "#9ca3af" }}>
          Loading bay status...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        overflow: "hidden",
        padding: 20
      }}>
        <div style={{ textAlign: "center", color: "#ef4444" }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(0,0,0,0.35)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: 20,
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e5e7eb", margin: 0 }}>
          🏪 Shop Bays
        </h2>
        <span style={{ color: "#9ca3af", fontSize: 12 }}>
          {bays.filter(b => b.isOccupied).length} of {shopCapacity} bays occupied
        </span>
      </div>

      {/* Bays Grid */}
      <div style={{
        padding: 20,
        maxHeight: 600,
        overflowY: "auto"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16
        }}>
          {bays.map((bay) => (
            <div
              key={bay.id}
              style={{
                background: bay.isOccupied
                  ? "rgba(59,130,246,0.1)"
                  : "rgba(255,255,255,0.02)",
                border: bay.isOccupied
                  ? "1px solid rgba(59,130,246,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: 16,
                minHeight: 140
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12
              }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#e5e7eb",
                  margin: 0
                }}>
                  Bay {bay.id}
                </h3>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: bay.isOccupied ? "#22c55e" : "#6b7280"
                }} />
              </div>

              {bay.isOccupied && bay.workOrder ? (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      marginBottom: 2
                    }}>
                      Work Order
                    </div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#e5e7eb"
                    }}>
                      {bay.workOrder.id}
                    </div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      marginBottom: 2
                    }}>
                      Customer
                    </div>
                    <div style={{
                      fontSize: 14,
                      color: "#e5e7eb"
                    }}>
                      {bay.workOrder.customer ? `${bay.workOrder.customer.firstName} ${bay.workOrder.customer.lastName}` : 'Unknown'}
                    </div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      marginBottom: 2
                    }}>
                      Vehicle
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: "#e5e7eb"
                    }}>
                      {bay.workOrder.vehicleType}
                    </div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      marginBottom: 2
                    }}>
                      Tech
                    </div>
                    <div style={{
                      fontSize: 14,
                      color: "#e5e7eb"
                    }}>
                      {bay.workOrder.assignedTo ? `${bay.workOrder.assignedTo.firstName} ${bay.workOrder.assignedTo.lastName}` : "Unassigned"}
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <div style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        marginBottom: 2
                      }}>
                        Status
                      </div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#e5e7eb"
                      }}>
                        {bay.workOrder.status}
                      </div>
                    </div>

                    <div style={{
                      padding: "4px 8px",
                      background: bay.workOrder.status === 'in-progress' ? "#22c55e" : 
                                 bay.workOrder.status === 'pending' ? "#eab308" : "#6b7280",
                      color: "white",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      {bay.workOrder.status}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 80,
                  color: "#6b7280",
                  fontSize: 14
                }}>
                  Available
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}