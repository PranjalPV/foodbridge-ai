require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient = null;
const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

if (isConfigured) {
    try {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("⚡ [Supabase] Connected to live Supabase Cloud project!");
    } catch (err) {
        console.warn("⚠️ [Supabase] Failed to initialize live client:", err.message);
    }
} else {
    console.log("ℹ️ [Supabase] No SUPABASE_URL found in .env. Running on built-in active store.");
}

// Built-in in-memory store for instant demonstration & local testing
const localStore = {
    donations: [
        {
            id: "don_1",
            foodName: "Fresh Steamed Vegetable Biryani",
            category: "Rice & Biryani",
            foodType: "Vegetarian",
            quantity: 45,
            cookedTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            safeUntil: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
            urgencyScore: "CRITICAL",
            status: "AVAILABLE",
            restaurantName: "Royal Spice Grand",
            address: "Hazratganj, Lucknow",
            latitude: 26.8467,
            longitude: 80.9462,
            co2SavedKg: 112.5,
            fssaiCompliance: "High-risk starch within FSSAI danger zone. Emergency 2-hour distribution protocol active.",
            createdAt: new Date().toISOString()
        },
        {
            id: "don_2",
            foodName: "Dal Makhani & Naan",
            category: "Rice & Biryani",
            foodType: "Vegetarian",
            quantity: 30,
            cookedTime: new Date(Date.now() - 3.2 * 60 * 60 * 1000).toISOString(),
            safeUntil: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
            urgencyScore: "CRITICAL",
            status: "AVAILABLE",
            restaurantName: "Awadh Delights",
            address: "Gomti Nagar, Lucknow",
            latitude: 26.8530,
            longitude: 80.9980,
            co2SavedKg: 75.0,
            fssaiCompliance: "Perishable dairy gravy near 4-hour ambient threshold. Immediate dispatch required.",
            createdAt: new Date().toISOString()
        },
        {
            id: "don_3",
            foodName: "Whole Wheat Chapatis & Dry Sabzi",
            category: "Roti & Chapati",
            foodType: "Vegetarian",
            quantity: 80,
            cookedTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            safeUntil: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            urgencyScore: "SAFE",
            status: "AVAILABLE",
            restaurantName: "Annapurna Kitchen",
            address: "Aliganj, Lucknow",
            latitude: 26.8850,
            longitude: 80.9450,
            co2SavedKg: 200.0,
            fssaiCompliance: "Low moisture grain item with safe window > 6 hours.",
            createdAt: new Date().toISOString()
        }
    ],
    ngos: [
        {
            id: "ngo_1",
            name: "Asha Children Home",
            address: "Hazratganj, Lucknow",
            latitude: 26.8490,
            longitude: 80.9420,
            dailyNeed: 60,
            preferredDiet: "Vegetarian",
            hasRefrigeration: true,
            contactPerson: "Dr. Ananya Sharma",
            phone: "+91 98765 43210"
        },
        {
            id: "ngo_2",
            name: "Robin Food Trust",
            address: "Gomti Nagar, Lucknow",
            latitude: 26.8550,
            longitude: 80.9920,
            dailyNeed: 120,
            preferredDiet: "Any",
            hasRefrigeration: true,
            contactPerson: "Rahul Verma",
            phone: "+91 98765 12345"
        },
        {
            id: "ngo_3",
            name: "Umeed Senior Shelter",
            address: "Aliganj, Lucknow",
            latitude: 26.8820,
            longitude: 80.9410,
            dailyNeed: 40,
            preferredDiet: "Vegetarian",
            hasRefrigeration: false,
            contactPerson: "Meera Saxena",
            phone: "+91 98765 67890"
        }
    ],
    volunteers: [
        {
            id: "vol_1",
            name: "Arjun Singh",
            phone: "+91 98111 22334",
            currentLat: 26.8480,
            currentLng: 80.9450,
            vehicleType: "Electric Scooter",
            status: "AVAILABLE",
            totalDeliveries: 18,
            co2AvoidedKg: 450
        }
    ],
    claims: []
};

function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
}

module.exports = {
    isSupabaseConfigured: isConfigured,
    supabase: supabaseClient,
    localStore,
    getDistanceKm
};
