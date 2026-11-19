import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const roleParam = searchParams.get("role");
    const [selectedRole, setSelectedRole] = useState(roleParam || "restaurant");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const roleDisplayNames = {
        restaurant: "Restaurant",
        ngo: "NGO",
        volunteer: "Volunteer",
    };

    const handleLoginSubmit = (e) => {
        e.preventDefault();

        const defaultNames = {
            restaurant: "Royal Spice Grand",
            ngo: "Asha Children Shelter",
            volunteer: "Arjun Singh"
        };

        const userData = {
            email: email || `${selectedRole}@foodbridge.org`,
            name: defaultNames[selectedRole] || "Demo User",
            role: selectedRole,
            token: `fb_jwt_${Date.now()}`
        };

        localStorage.setItem("foodbridge_user", JSON.stringify(userData));
        navigate(`/dashboard/${selectedRole}`);
    };

    const handleQuickLogin = (role) => {
        setSelectedRole(role);
        const defaultNames = {
            restaurant: "Royal Spice Grand",
            ngo: "Asha Children Shelter",
            volunteer: "Arjun Singh"
        };
        const userData = {
            email: `${role}@foodbridge.org`,
            name: defaultNames[role],
            role: role,
            token: `fb_jwt_${Date.now()}`
        };
        localStorage.setItem("foodbridge_user", JSON.stringify(userData));
        navigate(`/dashboard/${role}`);
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    🌱 FoodBridge <span>AI</span>
                </div>

                <h1>Welcome Back</h1>
                <p className="login-subtitle">
                    Login to your {roleDisplayNames[selectedRole]} portal
                </p>

                {/* Role Switcher Pills */}
                <div className="role-switch-pills">
                    <button
                        type="button"
                        className={`role-pill ${selectedRole === "restaurant" ? "active" : ""}`}
                        onClick={() => setSelectedRole("restaurant")}
                    >
                        🏪 Restaurant
                    </button>
                    <button
                        type="button"
                        className={`role-pill ${selectedRole === "ngo" ? "active" : ""}`}
                        onClick={() => setSelectedRole("ngo")}
                    >
                        🏢 NGO
                    </button>
                    <button
                        type="button"
                        className={`role-pill ${selectedRole === "volunteer" ? "active" : ""}`}
                        onClick={() => setSelectedRole("volunteer")}
                    >
                        🚴 Volunteer
                    </button>
                </div>

                <form onSubmit={handleLoginSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder={`e.g. contact@${selectedRole}.org`}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="login-options">
                        <label>
                            <input type="checkbox" defaultChecked />
                            Remember session
                        </label>
                        <a href="#forgot" onClick={(e) => e.preventDefault()}>
                            Forgot Password?
                        </a>
                    </div>

                    <button type="submit" className="login-submit">
                        Login as {roleDisplayNames[selectedRole]} →
                    </button>
                </form>

                {/* Instant 1-Click Demo Login */}
                <div className="demo-login-box">
                    <small>⚡ Fast Testing / Evaluation Logins:</small>
                    <div className="demo-btns">
                        <button type="button" onClick={() => handleQuickLogin("restaurant")}>
                            🏪 As Restaurant
                        </button>
                        <button type="button" onClick={() => handleQuickLogin("ngo")}>
                            🏢 As NGO
                        </button>
                        <button type="button" onClick={() => handleQuickLogin("volunteer")}>
                            🚴 As Volunteer
                        </button>
                    </div>
                </div>

                <p className="register-text">
                    Don't have an account?{" "}
                    <Link to={`/register?role=${selectedRole}`}>
                        Create {roleDisplayNames[selectedRole]} Account
                    </Link>
                </p>

                <Link to="/" className="back-home">
                    ← Back to Home
                </Link>
            </div>
        </div>
    );
}

export default Login;
