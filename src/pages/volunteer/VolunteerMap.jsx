import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./VolunteerMap.css";

function VolunteerMap() {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const [ecoMetrics, setEcoMetrics] = useState({
        co2AvoidedKg: 50,
        methaneAvoidedKg: 5.0,
        waterConservedLiters: 7500,
        carKmSaved: 238
    });
    const [routeStatus, setRouteStatus] = useState("Active Pickup");
    const [gpsActive, setGpsActive] = useState(false);

    useEffect(() => {
        // Initialize Leaflet Map
        const initMap = () => {
            if (!window.L || !mapRef.current || mapInstance.current) return;

            const pickupCoords = [26.8467, 80.9462]; // Hazratganj
            const deliveryCoords = [26.8550, 80.9920]; // Gomti Nagar
            const volunteerCoords = [26.8480, 80.9450]; // Live Volunteer

            const map = window.L.map(mapRef.current).setView([26.8500, 80.9650], 13);
            mapInstance.current = map;

            // OpenStreetMap tile layer (100% free, no API key needed)
            window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap contributors",
                maxZoom: 18
            }).addTo(map);

            // Custom Leaflet DivIcons with emoji
            const createEmojiIcon = (emoji, bg) => {
                return window.L.divIcon({
                    className: "custom-leaflet-marker",
                    html: `<div style="background:${bg}; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; border:2px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.3);">${emoji}</div>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                });
            };

            // Pickup Marker
            const pMarker = window.L.marker(pickupCoords, { icon: createEmojiIcon("🏪", "#10b981") })
                .addTo(map)
                .bindPopup("<b>🏪 Pickup: Royal Spice Restaurant</b><br>45 meals • Vegetable Biryani");

            // Delivery Marker
            const dMarker = window.L.marker(deliveryCoords, { icon: createEmojiIcon("🏢", "#3b82f6") })
                .addTo(map)
                .bindPopup("<b>🏢 Delivery: Asha Children Home</b><br>Beneficiaries: 60 children");

            // Volunteer Marker
            const vMarker = window.L.marker(volunteerCoords, { icon: createEmojiIcon("🚴", "#f59e0b") })
                .addTo(map)
                .bindPopup("<b>🚴 You (Volunteer)</b><br>En route to pickup location");

            // Green Route Polyline
            const routeCoords = [volunteerCoords, pickupCoords, deliveryCoords];
            window.L.polyline(routeCoords, {
                color: "#10b981",
                weight: 5,
                opacity: 0.8,
                dashArray: "8, 8"
            }).addTo(map);

            // Fetch live GPS if supported
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setGpsActive(true);
                        const userLat = pos.coords.latitude;
                        const userLng = pos.coords.longitude;
                        vMarker.setLatLng([userLat, userLng]);
                    },
                    (err) => console.log("Using default demo GPS coordinates:", err.message),
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            }
        };

        // If Leaflet script is still loading, wait a moment
        if (window.L) {
            initMap();
        } else {
            const timer = setTimeout(initMap, 500);
            return () => clearTimeout(timer);
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    return (
        <DashboardLayout
            title="Pickup & Delivery Map"
            subtitle="AI Green Logistics & Real-Time Navigation"
            role="Volunteer"
        >
            <div className="volunteer-map-header">
                <div>
                    <h1>Pickup & Delivery Map 📍</h1>
                    <p>
                        Autonomous Green Route & Carbon Footprint Optimization
                    </p>
                </div>

                <div className="map-status">
                    🟢 {routeStatus} {gpsActive ? "• 📡 Live GPS Connected" : "• Demo Route"}
                </div>
            </div>

            <div className="map-layout">
                {/* Real OpenStreetMap Container */}
                <div className="map-container">
                    <div
                        ref={mapRef}
                        style={{ height: "520px", width: "100%", borderRadius: "14px" }}
                    />
                </div>

                {/* Route & AI Carbon Impact Sidebar */}
                <div className="route-info-card">
                    <div className="route-info-header">
                        <div>
                            <span className="active-route-badge">AI OPTIMIZED ROUTE</span>
                            <h2>Fresh Vegetable Biryani</h2>
                            <p className="route-qty">45 servings • Airtight Containers</p>
                        </div>
                    </div>

                    <div className="route-steps">
                        <div className="step-item">
                            <div className="step-marker pickup">🏪</div>
                            <div>
                                <strong>Pickup: Royal Spice Restaurant</strong>
                                <span>Hazratganj, Lucknow • Prepared 1.5h ago</span>
                            </div>
                        </div>

                        <div className="step-line"></div>

                        <div className="step-item">
                            <div className="step-marker delivery">🏢</div>
                            <div>
                                <strong>Delivery: Asha Children Home</strong>
                                <span>Gomti Nagar, Lucknow • 60 Beneficiaries</span>
                            </div>
                        </div>
                    </div>

                    {/* Feature 5: AI Green Routing & CO2 Saved Calculator */}
                    <div className="eco-impact-box">
                        <div className="eco-header">
                            <span className="eco-leaf">🌱</span>
                            <strong>Feature 5: AI Environmental Impact</strong>
                        </div>

                        <div className="eco-grid">
                            <div className="eco-stat">
                                <span className="stat-val">{ecoMetrics.co2AvoidedKg} kg</span>
                                <span className="stat-lbl">CO₂e Avoided</span>
                            </div>

                            <div className="eco-stat">
                                <span className="stat-val">{ecoMetrics.methaneAvoidedKg} kg</span>
                                <span className="stat-lbl">CH₄ Prevented</span>
                            </div>

                            <div className="eco-stat">
                                <span className="stat-val">{ecoMetrics.waterConservedLiters} L</span>
                                <span className="stat-lbl">Water Conserved</span>
                            </div>

                            <div className="eco-stat">
                                <span className="stat-val">{ecoMetrics.carKmSaved} km</span>
                                <span className="stat-lbl">Car Km Offset</span>
                            </div>
                        </div>

                        <small className="eco-citation">
                            Calculated using UNEP/FAO food rescue coefficients (1 kg rescued = 2.5 kg CO₂e).
                        </small>
                    </div>

                    <div className="route-actions">
                        <button
                            className="pickup-done-btn"
                            onClick={() => setRouteStatus("Food Collected! En route to NGO")}
                        >
                            ✓ Mark Picked Up
                        </button>
                        <button
                            className="delivery-done-btn"
                            onClick={() => {
                                setRouteStatus("Delivered! 🎉 Impact Recorded");
                                alert("Delivery completed! 50 kg CO₂e saved and logged in your volunteer impact profile.");
                            }}
                        >
                            🎉 Confirm Delivery
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default VolunteerMap;
