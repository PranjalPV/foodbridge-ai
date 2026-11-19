import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { API_BASE_URL } from "../../config/api";
import "./AvailablePickups.css";

function AvailablePickups() {
    const navigate = useNavigate();
    const [pickups, setPickups] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterUrgent, setFilterUrgent] = useState("all");

    useEffect(() => {
        const fetchPickups = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/donations`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setPickups(data.data);
                        return;
                    }
                }
            } catch (err) {
                console.log("Using local mock pickups:", err.message);
            }

            setPickups([
                {
                    id: "don_1",
                    foodName: "Fresh Vegetable Biryani",
                    quantity: 45,
                    urgencyScore: "CRITICAL",
                    restaurantName: "Royal Spice Grand",
                    pickupAddress: "Hazratganj, Lucknow",
                    destinationNGO: "Asha Children Home",
                    distanceKm: 0.8
                },
                {
                    id: "don_2",
                    foodName: "Dal Makhani & Naan",
                    quantity: 30,
                    urgencyScore: "CRITICAL",
                    restaurantName: "Awadh Delights",
                    pickupAddress: "Gomti Nagar, Lucknow",
                    destinationNGO: "Robin Food Trust",
                    distanceKm: 2.1
                },
                {
                    id: "don_3",
                    foodName: "Whole Wheat Chapatis & Sabzi",
                    quantity: 80,
                    urgencyScore: "SAFE",
                    restaurantName: "Annapurna Kitchen",
                    pickupAddress: "Aliganj, Lucknow",
                    destinationNGO: "Umeed Senior Shelter",
                    distanceKm: 3.4
                }
            ]);
        };

        fetchPickups();
    }, []);

    const handleAcceptPickup = (pickup) => {
        alert(`🚴 Pickup Accepted for ${pickup.foodName}! Opening Live Navigation Map.`);
        navigate("/map");
    };

    let filtered = pickups.filter((p) => {
        const matchesSearch = p.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.restaurantName && p.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesUrgency = filterUrgent === "all" || (filterUrgent === "urgent" && p.urgencyScore === "CRITICAL");
        return matchesSearch && matchesUrgency;
    });

    return (
        <DashboardLayout
            title="Available Pickups"
            subtitle="Autonomous Volunteer Dispatch & Green Route Planner"
            role="Volunteer"
        >
            <div className="available-pickups-header">
                <div>
                    <h1>Available Pickups 🚴</h1>
                    <p>
                        Choose a surplus pickup. Optimized by AI Green Logistics to minimize transit time and carbon footprint.
                    </p>
                </div>

                <div className="pickup-location">
                    📍 Lucknow (Active Zone)
                </div>
            </div>

            {/* Filter Bar */}
            <div className="pickup-filter-bar">
                <input
                    type="text"
                    placeholder="Search restaurant or food item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select value={filterUrgent} onChange={(e) => setFilterUrgent(e.target.value)}>
                    <option value="all">All Pickups</option>
                    <option value="urgent">🔴 High Priority (Under 1.5h safe left)</option>
                </select>
            </div>

            {/* Pickups Grid */}
            <div className="pickup-grid">
                {filtered.map((item) => (
                    <div key={item.id} className="pickup-card">
                        <div className="pickup-card-top">
                            <div className="pickup-icon">
                                {item.category?.includes("Rice") ? "🍚" : "🍱"}
                            </div>

                            <span className={`urgent-pickup-badge ${item.urgencyScore === "CRITICAL" ? "urgent" : ""}`}>
                                {item.urgencyScore === "CRITICAL" ? "🔴 Urgent Danger Zone" : "🟢 Safe Window"}
                            </span>
                        </div>

                        <h2>{item.foodName}</h2>

                        <p className="pickup-description">
                            {item.fssaiCompliance || "Prepared in accordance with FSSAI thermal food-holding regulations."}
                        </p>

                        <div className="pickup-details">
                            <div>
                                <span>Quantity</span>
                                <strong>{item.quantity} Meals</strong>
                            </div>

                            <div>
                                <span>Distance</span>
                                <strong>{item.distanceKm || "1.8"} km</strong>
                            </div>

                            <div>
                                <span>Carbon Avoided</span>
                                <strong>🌱 {Number((item.quantity * 0.4 * 2.5).toFixed(1))} kg CO₂e</strong>
                            </div>
                        </div>

                        <div className="pickup-route">
                            <div className="route-point">
                                <span>🏪 Pickup:</span>
                                <strong>{item.restaurantName || "Partner Restaurant"} ({item.address || "Hazratganj"})</strong>
                            </div>
                            <div className="route-point">
                                <span>🏢 Delivery:</span>
                                <strong>{item.destinationNGO || "Asha Children Home (Gomti Nagar)"}</strong>
                            </div>
                        </div>

                        <button
                            className="accept-pickup-btn"
                            onClick={() => handleAcceptPickup(item)}
                        >
                            Accept Pickup & Navigate →
                        </button>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}

export default AvailablePickups;
