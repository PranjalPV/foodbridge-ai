const express = require("express");
const cors = require("cors");
require("dotenv").config();

const aiRoutes = require("./routes/aiRoutes");
const donationRoutes = require("./routes/donationRoutes");

const app = express();

// Increase JSON limits to handle base64 image uploads for Vision AI
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Mount API routes
app.use("/api/ai", aiRoutes);
app.use("/api/donations", donationRoutes);

// Health check and system diagnostic
app.get("/", (req, res) => {
    res.json({
        name: "FoodBridge AI Autonomous Engine",
        status: "ONLINE",
        version: "2.0.0",
        features: [
            "Agent 1: Multimodal Vision Food Inspector",
            "Agent 2: RAG Spoilage Risk Assessor (FSSAI 2019 Guidelines)",
            "Agent 3: Autonomous Matchmaker Agent",
            "Agent 4: Green Route & Carbon Footprint Engine",
            "Agent 5: Conversational BridgeBot with RAG Grounding"
        ],
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`===============================================`);
    console.log(`🌱 FoodBridge AI Backend Server Running on :${PORT}`);
    console.log(`🤖 Agentic AI + RAG Safety System Active`);
    console.log(`===============================================`);
});
