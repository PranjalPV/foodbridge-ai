import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { API_BASE_URL } from "../../config/api";
import { Link } from "react-router-dom";
import "./MyRequests.css";

function MyRequests() {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/donations`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setRequests(data.data);
                        return;
                    }
                }
            } catch (err) {
                console.log("Using local mock requests:", err.message);
            }

            setRequests([
                {
                    id: "req_1",
                    foodName: "Fresh Vegetable Biryani",
                    quantity: 45,
                    restaurantName: "Royal Spice Grand",
                    status: "OUT_FOR_DELIVERY",
                    volunteerName: "Arjun Singh",
                    eta: "18 mins"
                },
                {
                    id: "req_2",
                    foodName: "Dal Makhani & Naan",
                    quantity: 30,
                    restaurantName: "Awadh Delights",
                    status: "ASSIGNED",
                    volunteerName: "Volunteer Dispatched",
                    eta: "30 mins"
                },
                {
                    id: "req_3",
                    foodName: "Whole Wheat Chapatis",
                    quantity: 80,
                    restaurantName: "Annapurna Kitchen",
                    status: "DELIVERED",
                    volunteerName: "Priya Sharma",
                    eta: "Delivered Today"
                }
            ]);
        };

        fetchRequests();
    }, []);

    const totalCount = requests.length;
    const activeCount = requests.filter(r => r.status !== "DELIVERED").length;
    const deliveredCount = requests.filter(r => r.status === "DELIVERED" || r.status === "COMPLETED").length;

    return (
        <DashboardLayout
            title="My Requests"
            subtitle="Track your surplus food claims and volunteer deliveries"
            role="NGO"
        >
            <div className="my-requests-header">
                <div>
                    <h1>My Food Requests 📋</h1>
                    <p>
                        Real-time status of claimed surplus donations and incoming volunteer dispatches.
                    </p>
                </div>

                <Link to="/ngo/available-food" className="find-food-btn">
                    🍱 Find More Food
                </Link>
            </div>

            {/* Summary Statistics */}
            <div className="request-summary">
                <div className="request-summary-card">
                    <span>📋</span>
                    <div>
                        <h3>{totalCount}</h3>
                        <p>Total Requests</p>
                    </div>
                </div>

                <div className="request-summary-card">
                    <span>🚴</span>
                    <div>
                        <h3>{activeCount}</h3>
                        <p>In Transit / Pending</p>
                    </div>
                </div>

                <div className="request-summary-card">
                    <span>✅</span>
                    <div>
                        <h3>{deliveredCount}</h3>
                        <p>Successfully Received</p>
                    </div>
                </div>
            </div>

            {/* Requests List */}
            <div className="requests-list">
                {requests.map((req) => (
                    <div key={req.id} className="request-card" style={{
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "18px 22px",
                        marginBottom: "14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <div>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "4px" }}>
                                <strong style={{ fontSize: "16px", color: "#111827" }}>{req.foodName}</strong>
                                <span style={{
                                    background: "#dcfce7",
                                    color: "#15803d",
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                    padding: "2px 8px",
                                    borderRadius: "4px"
                                }}>
                                    {req.quantity} Meals
                                </span>
                            </div>
                            <span style={{ fontSize: "13px", color: "#6b7280" }}>
                                Donor: {req.restaurantName || "Partner Restaurant"} • Volunteer: {req.volunteerName || "Arjun Singh (EV Scooter)"}
                            </span>
                        </div>

                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <span style={{
                                background: req.status === "DELIVERED" ? "#f3f4f6" : "#ecfdf5",
                                color: req.status === "DELIVERED" ? "#4b5563" : "#059669",
                                border: "1px solid #a7f3d0",
                                padding: "6px 12px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "bold"
                            }}>
                                {req.status === "DELIVERED" ? "✓ Delivered & Confirmed" : `🚴 En Route (${req.eta || "15 mins"})`}
                            </span>

                            <Link
                                to="/map"
                                style={{
                                    background: "#10b981",
                                    color: "white",
                                    padding: "6px 14px",
                                    borderRadius: "6px",
                                    textDecoration: "none",
                                    fontSize: "12px",
                                    fontWeight: "600"
                                }}
                            >
                                Track Live Map →
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}

export default MyRequests;
