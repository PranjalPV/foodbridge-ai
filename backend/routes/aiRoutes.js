const express = require("express");
const router = express.Router();
const {
    inspectFoodPhoto,
    assessSpoilageAndSafety,
    matchDonationWithNGOs,
    calculateGreenLogistics,
    chatWithBridgeBot
} = require("../services/agentOrchestrator");
const { searchGuidelines, knowledgeCorpus } = require("../services/ragService");

// 1. Feature 1: AI Food Inspector & Auto-Fill (Vision AI)
router.post("/inspect-food", async (req, res) => {
    try {
        const { imageBase64, mimeType, textHint } = req.body;
        const result = await inspectFoodPhoto({ imageBase64, mimeType, textHint });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error("Error in /inspect-food:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Feature 2: Intelligent Spoilage & Shelf-Life Predictor (RAG + Spoilage Kinetics)
router.post("/predict-spoilage", async (req, res) => {
    try {
        const { foodName, category, cookedTimeHoursAgo, ambientTempC } = req.body;
        const result = await assessSpoilageAndSafety({
            foodName,
            category,
            cookedTimeHoursAgo,
            ambientTempC
        });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error("Error in /predict-spoilage:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Feature 3: Smart Matchmaker (Autonomous Matchmaker Agent)
router.post("/match-ngos", (req, res) => {
    try {
        const { donationLat, donationLng, quantity, foodType, category } = req.body;
        const result = matchDonationWithNGOs({
            donationLat: donationLat || 26.8467,
            donationLng: donationLng || 80.9462,
            quantity: Number(quantity) || 40,
            foodType: foodType || "Vegetarian",
            category: category || "Rice & Biryani"
        });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error("Error in /match-ngos:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Feature 4: Predictive Surplus Forecasting (For Restaurants)
router.post("/forecast-surplus", (req, res) => {
    try {
        const { dayOfWeek, expectedCovers, isWeekend, isHoliday } = req.body;

        // Machine learning regression heuristic modeled on restaurant hospitality trends
        const covers = Number(expectedCovers) || 150;
        const day = Number(dayOfWeek) || new Date().getDay();
        const weekendFactor = (isWeekend || day === 0 || day === 5 || day === 6) ? 1.35 : 1.0;
        const holidayFactor = isHoliday ? 1.25 : 1.0;

        // Base surplus average ~ 8% of covers prepared, modulated by traffic variance
        const predictedMeals = Math.round(covers * 0.09 * weekendFactor * holidayFactor);
        const lowerBound = Math.max(5, predictedMeals - 6);
        const upperBound = predictedMeals + 8;

        const advice = predictedMeals > 30
            ? "High surplus anticipated for tonight. We recommend pre-alerting nearby shelters (e.g. Asha Children Home) by 8:00 PM."
            : "Moderate surplus expected. Standard daily donation channel recommended.";

        res.json({
            success: true,
            data: {
                expectedCovers: covers,
                predictedSurplusMeals: predictedMeals,
                confidenceInterval: `${lowerBound} - ${upperBound} meals`,
                urgencyTrend: predictedMeals > 35 ? "HIGH" : "NORMAL",
                actionableRecommendation: advice,
                timestamp: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error("Error in /forecast-surplus:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Feature 5: AI Green Routing & CO2 Saved Calculator
router.post("/green-logistics", (req, res) => {
    try {
        const { quantityServings, pickupLat, pickupLng, ngoLat, ngoLng } = req.body;
        const result = calculateGreenLogistics({
            quantityServings,
            pickupLat,
            pickupLng,
            ngoLat,
            ngoLng
        });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error("Error in /green-logistics:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Conversational BridgeBot (RAG Assistant)
router.post("/chat", async (req, res) => {
    try {
        const { message, chatHistory } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, error: "Message is required" });
        }
        const result = await chatWithBridgeBot({ message, chatHistory });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error("Error in /chat:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 7. RAG Knowledge Search Endpoint
router.get("/rag/guidelines", (req, res) => {
    try {
        const query = req.query.q || "";
        if (!query) {
            return res.json({ success: true, data: knowledgeCorpus });
        }
        const results = searchGuidelines(query, 5);
        res.json({ success: true, query, data: results });
    } catch (err) {
        console.error("Error in /rag/guidelines:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
