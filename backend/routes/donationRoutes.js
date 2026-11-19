const express = require("express");
const router = express.Router();
const { localStore } = require("../config/supabase");
const { assessSpoilageAndSafety, matchDonationWithNGOs } = require("../services/agentOrchestrator");

// GET all donations
router.get("/", (req, res) => {
    try {
        const { status, category } = req.query;
        let list = [...localStore.donations];

        if (status) {
            list = list.filter(d => d.status.toLowerCase() === status.toLowerCase());
        }
        if (category) {
            list = list.filter(d => d.category.toLowerCase().includes(category.toLowerCase()));
        }

        res.json({ success: true, count: list.length, data: list });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET single donation
router.get("/:id", (req, res) => {
    const donation = localStore.donations.find(d => d.id === req.params.id);
    if (!donation) {
        return res.status(404).json({ success: false, error: "Donation not found" });
    }
    res.json({ success: true, data: donation });
});

// POST create donation (Autonomous AI pipeline triggered)
router.post("/", async (req, res) => {
    try {
        const {
            foodName,
            category,
            foodType,
            quantity,
            cookedTimeHoursAgo = 1,
            address = "Hazratganj, Lucknow",
            latitude = 26.8467,
            longitude = 80.9462,
            restaurantName = "Partner Restaurant"
        } = req.body;

        if (!foodName || !quantity) {
            return res.status(400).json({ success: false, error: "foodName and quantity are required" });
        }

        // 1. Run Autonomous Safety & Spoilage Agent (RAG-Driven)
        const safetyResult = await assessSpoilageAndSafety({
            foodName,
            category: category || "Rice & Biryani",
            cookedTimeHoursAgo: Number(cookedTimeHoursAgo) || 1,
            ambientTempC: 28
        });

        // 2. Run Autonomous Matchmaker Agent
        const matchResult = matchDonationWithNGOs({
            donationLat: latitude,
            donationLng: longitude,
            quantity: Number(quantity),
            foodType: foodType || "Vegetarian",
            category: category || "Rice & Biryani"
        });

        const newDonation = {
            id: `don_${Date.now()}`,
            foodName,
            category: category || "Other",
            foodType: foodType || "Vegetarian",
            quantity: Number(quantity),
            cookedTime: new Date(Date.now() - (Number(cookedTimeHoursAgo) || 1) * 3600000).toISOString(),
            safeUntil: safetyResult.safeUntil,
            urgencyScore: safetyResult.urgencyScore,
            status: "AVAILABLE",
            restaurantName,
            address,
            latitude: Number(latitude),
            longitude: Number(longitude),
            co2SavedKg: Number((quantity * 0.4 * 2.5).toFixed(1)),
            fssaiCompliance: safetyResult.regulatoryAnalysis,
            matchedNGO: matchResult.recommendedNGO,
            citations: safetyResult.citations,
            createdAt: new Date().toISOString()
        };

        localStore.donations.unshift(newDonation);

        res.status(201).json({
            success: true,
            message: "Donation created and processed through AI agents successfully!",
            data: newDonation,
            aiMatchReport: matchResult
        });
    } catch (err) {
        console.error("Error creating donation:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST claim donation (NGO)
router.post("/:id/claim", (req, res) => {
    try {
        const { ngoId = "ngo_1", ngoName = "Asha Children Home" } = req.body;
        const donation = localStore.donations.find(d => d.id === req.params.id);

        if (!donation) {
            return res.status(404).json({ success: false, error: "Donation not found" });
        }
        if (donation.status !== "AVAILABLE") {
            return res.status(400).json({ success: false, error: `Donation already ${donation.status}` });
        }

        donation.status = "CLAIMED";
        donation.claimedBy = { ngoId, ngoName, claimedAt: new Date().toISOString() };

        res.json({
            success: true,
            message: "Donation claimed successfully! Dispatched to Volunteer network.",
            data: donation
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
