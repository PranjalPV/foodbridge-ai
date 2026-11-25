const express = require("express");
const router = express.Router();
const { localStore, supabase, isSupabaseConfigured } = require("../config/supabase");
const { assessSpoilageAndSafety, matchDonationWithNGOs } = require("../services/agentOrchestrator");

// GET all donations
router.get("/", async (req, res) => {
    try {
        const { status, category } = req.query;

        // Try Supabase first if configured
        if (isSupabaseConfigured && supabase) {
            try {
                let query = supabase.from("donations").select("*").order("created_at", { ascending: false });
                if (status) query = query.ilike("status", status);
                if (category) query = query.ilike("category", `%${category}%`);

                const { data, error } = await query;
                if (!error && data && data.length > 0) {
                    // Map snake_case columns to camelCase for frontend compatibility
                    const formatted = data.map(d => ({
                        id: d.id,
                        foodName: d.food_name || d.foodName,
                        category: d.category,
                        foodType: d.food_type || d.foodType,
                        quantity: d.quantity,
                        cookedTime: d.cooked_time || d.cookedTime,
                        safeUntil: d.safe_until || d.safeUntil,
                        urgencyScore: d.urgency_score || d.urgencyScore,
                        status: d.status,
                        restaurantName: d.restaurant_name || d.restaurantName,
                        address: d.address,
                        latitude: d.latitude,
                        longitude: d.longitude,
                        co2SavedKg: Number(d.co2_saved_kg || d.co2SavedKg || 0),
                        fssaiCompliance: d.fssai_compliance || d.fssaiCompliance,
                        createdAt: d.created_at || d.createdAt
                    }));
                    return res.json({ success: true, count: formatted.length, data: formatted, source: "supabase" });
                }
            } catch (sErr) {
                console.warn("[Supabase Query Error - Falling back to local store]:", sErr.message);
            }
        }

        // Fallback to in-memory store
        let list = [...localStore.donations];

        if (status) {
            list = list.filter(d => d.status.toLowerCase() === status.toLowerCase());
        }
        if (category) {
            list = list.filter(d => d.category.toLowerCase().includes(category.toLowerCase()));
        }

        res.json({ success: true, count: list.length, data: list, source: "local_store" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET single donation
router.get("/:id", async (req, res) => {
    try {
        if (isSupabaseConfigured && supabase) {
            try {
                const { data, error } = await supabase.from("donations").select("*").eq("id", req.params.id).single();
                if (!error && data) {
                    return res.json({
                        success: true,
                        data: {
                            id: data.id,
                            foodName: data.food_name,
                            category: data.category,
                            foodType: data.food_type,
                            quantity: data.quantity,
                            cookedTime: data.cooked_time,
                            safeUntil: data.safe_until,
                            urgencyScore: data.urgency_score,
                            status: data.status,
                            restaurantName: data.restaurant_name,
                            address: data.address,
                            latitude: data.latitude,
                            longitude: data.longitude,
                            co2SavedKg: Number(data.co2_saved_kg || 0),
                            fssaiCompliance: data.fssai_compliance,
                            createdAt: data.created_at
                        }
                    });
                }
            } catch (sErr) {
                console.warn("[Supabase Single Query Error]:", sErr.message);
            }
        }

        const donation = localStore.donations.find(d => d.id === req.params.id);
        if (!donation) {
            return res.status(404).json({ success: false, error: "Donation not found" });
        }
        res.json({ success: true, data: donation });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
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

        // SAFETY ENFORCEMENT: Reject donation if expired or unfit according to FSSAI guidelines
        if (safetyResult.complianceStatus === "EXPIRED_UNFIT_FOR_DONATION" || safetyResult.remainingSafeHours <= 0) {
            return res.status(400).json({
                success: false,
                error: `Safety Alert: This food has exceeded the acceptable FSSAI ambient holding threshold (>4 hours in danger zone). Under FSSAI Regulations 2019, it cannot be accepted for human redistribution.`,
                complianceStatus: safetyResult.complianceStatus,
                regulatoryAnalysis: safetyResult.regulatoryAnalysis,
                citations: safetyResult.citations
            });
        }

        // 2. Run Autonomous Matchmaker Agent
        const matchResult = matchDonationWithNGOs({
            donationLat: Number(latitude) || 26.8467,
            donationLng: Number(longitude) || 80.9462,
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
            latitude: Number(latitude) || 26.8467,
            longitude: Number(longitude) || 80.9462,
            co2SavedKg: Number((quantity * 0.4 * 2.5).toFixed(1)),
            fssaiCompliance: safetyResult.regulatoryAnalysis,
            matchedNGO: matchResult.recommendedNGO,
            citations: safetyResult.citations,
            createdAt: new Date().toISOString()
        };

        // Persist to Supabase if available
        if (isSupabaseConfigured && supabase) {
            try {
                const { data: dbData, error: dbErr } = await supabase.from("donations").insert([{
                    restaurant_name: newDonation.restaurantName,
                    food_name: newDonation.foodName,
                    category: newDonation.category,
                    food_type: newDonation.foodType,
                    quantity: newDonation.quantity,
                    cooked_time: newDonation.cookedTime,
                    safe_until: newDonation.safeUntil,
                    urgency_score: newDonation.urgencyScore,
                    status: newDonation.status,
                    address: newDonation.address,
                    latitude: newDonation.latitude,
                    longitude: newDonation.longitude,
                    co2_saved_kg: newDonation.co2SavedKg,
                    fssai_compliance: newDonation.fssaiCompliance
                }]).select();

                if (!dbErr && dbData && dbData.length > 0) {
                    newDonation.id = dbData[0].id;
                }
            } catch (err) {
                console.warn("[Supabase Insert Warning - Saved locally]:", err.message);
            }
        }

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
router.post("/:id/claim", async (req, res) => {
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

        if (isSupabaseConfigured && supabase) {
            try {
                await supabase.from("donations").update({ status: "CLAIMED" }).eq("id", req.params.id);
            } catch (err) {
                console.warn("[Supabase Claim Update Warning]:", err.message);
            }
        }

        res.json({
            success: true,
            message: "Donation claimed successfully! Dispatched to Volunteer network.",
            data: donation
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST update status (Volunteer Pickup / In-Transit / Delivered)
router.post("/:id/status", async (req, res) => {
    try {
        const { status, volunteerName = "Arjun Singh" } = req.body;
        const validStatuses = ["AVAILABLE", "CLAIMED", "IN_TRANSIT", "DELIVERED"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }

        const donation = localStore.donations.find(d => d.id === req.params.id);
        if (!donation) {
            return res.status(404).json({ success: false, error: "Donation not found" });
        }

        donation.status = status;
        if (status === "IN_TRANSIT") {
            donation.volunteerName = volunteerName;
            donation.pickedUpAt = new Date().toISOString();
        } else if (status === "DELIVERED") {
            donation.deliveredAt = new Date().toISOString();
        }

        if (isSupabaseConfigured && supabase) {
            try {
                await supabase.from("donations").update({ status }).eq("id", req.params.id);
            } catch (err) {
                console.warn("[Supabase Status Update Warning]:", err.message);
            }
        }

        res.json({
            success: true,
            message: `Donation marked as ${status} successfully.`,
            data: donation
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
