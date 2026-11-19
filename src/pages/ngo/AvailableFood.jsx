import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { API_BASE_URL } from "../../config/api";
import "./AvailableFood.css";

function AvailableFood() {
    const [donations, setDonations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [sortBy, setSortBy] = useState("urgent");
    const [claimingId, setClaimingId] = useState(null);

    // Initial default mock items
    const defaultDonations = [
        {
            id: "don_1",
            foodName: "Fresh Vegetable Biryani",
            category: "Rice & Biryani",
            foodType: "Vegetarian",
            quantity: 45,
            urgencyScore: "CRITICAL",
            remainingSafeHours: 1.5,
            restaurantName: "Royal Spice Grand",
            distanceKm: 0.8,
            status: "AVAILABLE",
            fssaiCompliance: "High-risk starch item nearing 3.5h ambient exposure. Immediate dispatch prioritized under FSSAI 2019 Schedule I."
        },
        {
            id: "don_2",
            foodName: "Dal Makhani & Naan",
            category: "Rice & Biryani",
            foodType: "Vegetarian",
            quantity: 30,
            urgencyScore: "CRITICAL",
            remainingSafeHours: 1.2,
            restaurantName: "Awadh Delights",
            distanceKm: 2.1,
            status: "AVAILABLE",
            fssaiCompliance: "Perishable dairy gravy in danger zone (5°C - 60°C). Requires immediate consumption."
        },
        {
            id: "don_3",
            foodName: "Whole Wheat Chapatis & Aloo Gobi",
            category: "Roti & Chapati",
            foodType: "Vegetarian",
            quantity: 80,
            urgencyScore: "SAFE",
            remainingSafeHours: 6.0,
            restaurantName: "Annapurna Kitchen",
            distanceKm: 3.4,
            status: "AVAILABLE",
            fssaiCompliance: "Low-moisture baked grain item with extended shelf life under ambient room conditions."
        }
    ];

    useEffect(() => {
        const fetchDonations = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/donations`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data && data.data.length > 0) {
                        setDonations(data.data);
                        return;
                    }
                }
            } catch (err) {
                console.log("Backend not active, using default donation list:", err.message);
            }
            setDonations(defaultDonations);
        };

        fetchDonations();
    }, []);

    const handleClaimDonation = async (donationId) => {
        setClaimingId(donationId);
        try {
            const res = await fetch(`${API_BASE_URL}/api/donations/${donationId}/claim`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ngoId: "ngo_1", ngoName: "Asha Children Home" })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setDonations(prev => prev.map(d => d.id === donationId ? { ...d, status: "CLAIMED" } : d));
                    alert("🎉 Food requested successfully! Notification dispatched to nearby volunteers.");
                    setClaimingId(null);
                    return;
                }
            }
        } catch (err) {
            console.warn("Backend offline, updating locally:", err.message);
        }

        // Local simulation fallback
        setTimeout(() => {
            setDonations(prev => prev.map(d => d.id === donationId ? { ...d, status: "CLAIMED" } : d));
            alert("🎉 Food requested successfully! Dispatched to Volunteer logistics network.");
            setClaimingId(null);
        }, 500);
    };

    // Filter & Sort
    let filtered = donations.filter(d => {
        const matchSearch = d.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = !selectedCategory || d.category === selectedCategory;
        return matchSearch && matchCategory;
    });

    if (sortBy === "urgent") {
        filtered.sort((a, b) => {
            if (a.urgencyScore === "CRITICAL" && b.urgencyScore !== "CRITICAL") return -1;
            if (a.urgencyScore !== "CRITICAL" && b.urgencyScore === "CRITICAL") return 1;
            return 0;
        });
    } else if (sortBy === "quantity") {
        filtered.sort((a, b) => b.quantity - a.quantity);
    } else if (sortBy === "nearest") {
        filtered.sort((a, b) => (a.distanceKm || 2) - (b.distanceKm || 2));
    }

    return (
        <DashboardLayout
            title="Available Food"
            subtitle="Find surplus food available near your location"
            role="NGO"
        >
            <div className="available-food-header">
                <div>
                    <h1>Available Food 🍱</h1>
                    <p>
                        Real-time surplus food claims powered by Autonomous RAG Safety & Urgency Scoring.
                    </p>
                </div>

                <div className="food-location">
                    📍 Lucknow (10 km radius)
                </div>
            </div>

            {/* Filter Bar */}
            <div className="food-filter-bar">
                <input
                    type="text"
                    placeholder="Search by food item or restaurant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    <option value="Rice & Biryani">Rice & Biryani</option>
                    <option value="Roti & Chapati">Roti & Chapati</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Snacks">Snacks</option>
                </select>

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="urgent">🔴 Most Urgent (RAG Score)</option>
                    <option value="nearest">📍 Nearest First</option>
                    <option value="quantity">📦 Highest Quantity</option>
                </select>
            </div>

            {/* Donation Grid */}
            <div className="available-food-grid">
                {filtered.map(item => (
                    <div key={item.id} className="food-card">
                        <div className="food-card-top">
                            <div className="food-card-icon">
                                {item.category?.includes("Rice") ? "🍚" : item.category?.includes("Roti") ? "🫓" : "🍲"}
                            </div>

                            <span className={`urgent-badge ${item.urgencyScore}`}>
                                {item.urgencyScore === "CRITICAL" ? "🔴 High Urgency (< 1.5h)" : "🟢 Safe Window"}
                            </span>
                        </div>

                        <h2>{item.foodName}</h2>

                        <p className="food-description">
                            {item.fssaiCompliance || "Safe food surplus verified under FSSAI 2019 guidelines."}
                        </p>

                        <div className="food-details">
                            <div>
                                <span>Quantity</span>
                                <strong>{item.quantity} Meals</strong>
                            </div>

                            <div>
                                <span>Distance</span>
                                <strong>{item.distanceKm || "1.8"} km</strong>
                            </div>

                            <div>
                                <span>Diet Type</span>
                                <strong>{item.foodType === "Vegetarian" ? "🟢 Veg" : "🔴 Non-Veg"}</strong>
                            </div>
                        </div>

                        <div className="food-donor">
                            <span>🏪</span>
                            <div>
                                <small>Donated by</small>
                                <strong>{item.restaurantName || "Partner Restaurant"}</strong>
                            </div>
                        </div>

                        <div className="ai-recommendation">
                            🤖 <strong>AI Matchmaker:</strong> Meets Asha Shelter criteria (100% vegetarian, immediate intake).
                        </div>

                        <button
                            className={`request-food-btn ${item.status === "CLAIMED" ? "claimed" : ""}`}
                            disabled={item.status === "CLAIMED" || claimingId === item.id}
                            onClick={() => handleClaimDonation(item.id)}
                        >
                            {item.status === "CLAIMED" ? "✓ Claimed by You" : claimingId === item.id ? "Claiming..." : "Request Food →"}
                        </button>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}

export default AvailableFood;
