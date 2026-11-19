import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DashboardLayout.css";

function DashboardLayout({
    children,
    title = "Dashboard",
    subtitle = "Welcome to FoodBridge AI",
    role = "Restaurant"
}) {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("foodbridge_user");
            if (stored) {
                setCurrentUser(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Error reading session:", e);
        }
    }, []);

    const handleLogout = (e) => {
        e.preventDefault();
        localStorage.removeItem("foodbridge_user");
        navigate("/login");
    };

    // Role-specific sidebar navigation items
    const sidebarItems = {
        restaurant: [
            { name: "Dashboard", icon: "🏠", path: "/dashboard/restaurant" },
            { name: "Create Donation", icon: "➕", path: "/dashboard/restaurant/create-donation" },
            { name: "NGO Requests", icon: "📋", path: "/ngo/requests" },
            { name: "Live Route Map", icon: "📍", path: "/map" },
            { name: "My Impact", icon: "📊", path: "/impact" }
        ],
        ngo: [
            { name: "Dashboard", icon: "🏠", path: "/dashboard/ngo" },
            { name: "Available Food", icon: "🍱", path: "/ngo/available-food" },
            { name: "My Requests", icon: "📋", path: "/ngo/requests" },
            { name: "Donate Surplus", icon: "🤝", path: "/ngo/donate-food" },
            { name: "Live Route Map", icon: "📍", path: "/map" },
            { name: "My Impact", icon: "📊", path: "/impact" }
        ],
        volunteer: [
            { name: "Dashboard", icon: "🏠", path: "/dashboard/volunteer" },
            { name: "Available Pickups", icon: "📦", path: "/volunteer/pickups" },
            { name: "My Pickups", icon: "🚴", path: "/volunteer/my-pickups" },
            { name: "Live Route Map", icon: "📍", path: "/map" },
            { name: "Delivery History", icon: "📋", path: "/volunteer/history" },
            { name: "My Impact", icon: "📊", path: "/impact" }
        ]
    };

    const currentRole = (currentUser?.role || role).toLowerCase();
    const currentSidebar = sidebarItems[currentRole] || sidebarItems.restaurant;
    const displayName = currentUser?.name || (currentRole === "restaurant" ? "Royal Spice Grand" : currentRole === "ngo" ? "Asha Children Home" : "Arjun Singh");
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    🌱 FoodBridge <span>AI</span>
                </div>

                <nav className="sidebar-menu">
                    {currentSidebar.map((item) => (
                        <Link key={item.name} to={item.path}>
                            {item.icon} {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <button
                        onClick={handleLogout}
                        className="logout-link"
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px"
                        }}
                    >
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main">
                <header className="dashboard-navbar">
                    <div>
                        <h2>{title}</h2>
                        <p>{subtitle}</p>
                    </div>

                    {/* Active User Information & Quick Role Switcher */}
                    <div className="user-info">
                        <div className="user-avatar">{initial}</div>
                        <div>
                            <strong>{displayName}</strong>
                            <span>{currentRole.toUpperCase()}</span>
                        </div>
                    </div>
                </header>

                <section className="dashboard-content">
                    {children}
                </section>
            </main>
        </div>
    );
}

export default DashboardLayout;
