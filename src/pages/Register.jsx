import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const role = searchParams.get("role") || "restaurant";

    const roleNames = {
        restaurant: "Restaurant",
        ngo: "NGO",
        volunteer: "Volunteer"
    };

    const selectedRole = roleNames[role] || "User";

    const [fullName, setFullName] = useState("");
    const [orgName, setOrgName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("Lucknow");
    const [password, setPassword] = useState("");

    const handleRegisterSubmit = (e) => {
        e.preventDefault();

        const displayName = orgName || fullName || `${selectedRole} User`;
        const userData = {
            name: displayName,
            email: email || `${role}@foodbridge.org`,
            phone,
            location,
            role,
            token: `fb_jwt_${Date.now()}`
        };

        localStorage.setItem("foodbridge_user", JSON.stringify(userData));
        alert(`Account created successfully! Welcome to FoodBridge AI, ${displayName}.`);
        navigate(`/dashboard/${role}`);
    };

    return (
        <div className="register-page">
            <div className="register-card">
                <div className="register-logo">
                    🌱 FoodBridge <span>AI</span>
                </div>

                <h1>Create Your Account</h1>
                <p className="register-subtitle">
                    Register as a {selectedRole}
                </p>

                <form onSubmit={handleRegisterSubmit}>
                    <div className="form-group">
                        <label>Your Full Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Rahul Sharma"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    {role === "restaurant" && (
                        <div className="form-group">
                            <label>Restaurant / Kitchen Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Royal Spice Grand"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {role === "ngo" && (
                        <div className="form-group">
                            <label>NGO / Shelter Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Asha Children Trust"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Operating City / Location</label>
                        <input
                            type="text"
                            placeholder="e.g. Hazratganj, Lucknow"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="register-btn">
                        Complete Registration as {selectedRole} →
                    </button>
                </form>

                <p className="login-text">
                    Already have an account?{" "}
                    <Link to={`/login?role=${role}`}>Login</Link>
                </p>

                <Link to="/roles" className="back-link">
                    ← Choose another role
                </Link>
            </div>
        </div>
    );
}

export default Register;
