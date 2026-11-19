// Centralized API Base URL
// In development: http://localhost:5000
// In production (Render): set VITE_API_URL in Render environment settings
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
