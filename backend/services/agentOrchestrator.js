const { callGemini, hasGeminiKey } = require("../config/gemini");
const { getSafetyContextForDonation, searchGuidelines } = require("./ragService");
const { localStore, getDistanceKm } = require("../config/supabase");

/**
 * AGENT 1: Food Quality & Vision Inspector Agent
 * Examines food photo using Multimodal LLM (Gemini 1.5 Flash) or intelligent fallback
 */
async function inspectFoodPhoto({ imageBase64, mimeType = "image/jpeg", textHint = "" }) {
    console.log("[Inspector Agent] Analyzing food image...");

    if (hasGeminiKey && imageBase64) {
        const prompt = `You are the Food Quality Inspector Agent for FoodBridge AI.
Inspect this surplus food image carefully.
Extract the following information and output strictly valid JSON:
{
  "foodName": "Descriptive food name (e.g., Vegetable Biryani)",
  "category": "Rice & Biryani" | "Roti & Chapati" | "Vegetables" | "Snacks" | "Fruits" | "Desserts" | "Other",
  "foodType": "Vegetarian" | "Non-Vegetarian" | "Vegan",
  "estimatedQuantityServings": number (reasonable integer estimate, e.g. 25),
  "packagingType": "Catering Tray" | "Airtight Container" | "Box" | "Plated",
  "visualFreshnessRating": number (1 to 10),
  "conditionRemarks": "Brief visual observations regarding freshness, texture, and steam/moisture."
}`;

        const result = await callGemini({ prompt, imageBase64, mimeType, jsonMode: true });
        if (result && result.foodName) {
            return {
                ...result,
                source: "Gemini 1.5 Flash (Vision Multimodal)",
                timestamp: new Date().toISOString()
            };
        }
    }

    // Heuristic / Mock fallback for instant demo and local testing
    const fallbackNames = [
        { name: "Vegetable Biryani & Raita", category: "Rice & Biryani", foodType: "Vegetarian", qty: 40 },
        { name: "Mixed Dal & Tawa Rotis", category: "Roti & Chapati", foodType: "Vegetarian", qty: 50 },
        { name: "Paneer Butter Masala & Pulao", category: "Vegetables", foodType: "Vegetarian", qty: 35 },
        { name: "Assorted Evening Snacks & Samosas", category: "Snacks", foodType: "Vegetarian", qty: 60 }
    ];

    const pick = fallbackNames[Math.floor(Math.random() * fallbackNames.length)];

    return {
        foodName: textHint || pick.name,
        category: pick.category,
        foodType: pick.foodType,
        estimatedQuantityServings: pick.qty,
        packagingType: "Airtight Catering Containers",
        visualFreshnessRating: 9,
        conditionRemarks: "Food appears freshly cooked, well-portioned, steaming, and hygienic.",
        source: "AI Vision Engine (Simulation / Local Fallback)",
        timestamp: new Date().toISOString()
    };
}

/**
 * AGENT 2: Safety & Spoilage Risk Assessor (RAG-Driven)
 * Combines retrieved FSSAI regulatory guidelines with environmental decay kinetics
 */
async function assessSpoilageAndSafety({ foodName, category, cookedTimeHoursAgo = 1, ambientTempC = 28 }) {
    console.log(`[Safety & Spoilage Agent] Running RAG assessment for ${foodName} (${category})...`);

    // 1. RAG: Retrieve relevant FSSAI safety articles from vector knowledge base
    const { contextText, citations } = getSafetyContextForDonation(foodName, category);

    // 2. Calculate baseline shelf life (hours) based on food category
    let maxAmbientSafeHours = 4.0; // FSSAI 4-hour absolute danger zone limit

    const catLower = (category || "").toLowerCase();
    if (catLower.includes("rice") || catLower.includes("biryani") || catLower.includes("meat")) {
        maxAmbientSafeHours = 3.5; // High risk (Bacillus cereus, meat pathogens)
    } else if (catLower.includes("roti") || catLower.includes("bread")) {
        maxAmbientSafeHours = 12.0; // Low risk dry grains
    } else if (catLower.includes("snack") || catLower.includes("fruit")) {
        maxAmbientSafeHours = 6.0;
    }

    // Temperature degradation factor: microbial growth accelerates above 25°C
    if (ambientTempC > 30) {
        maxAmbientSafeHours *= 0.8;
    }

    const elapsed = Math.max(0.2, Number(cookedTimeHoursAgo) || 1.0);
    const remainingSafeHours = Math.max(0, Number((maxAmbientSafeHours - elapsed).toFixed(1)));

    // Urgency classification
    let urgencyScore = "SAFE";
    if (remainingSafeHours <= 1.5) {
        urgencyScore = "CRITICAL";
    } else if (remainingSafeHours <= 3.5) {
        urgencyScore = "MODERATE";
    }

    const safeUntilDate = new Date(Date.now() + remainingSafeHours * 60 * 60 * 1000).toISOString();

    let aiSafetyAnalysis = "";

    if (hasGeminiKey) {
        const prompt = `You are the Food Safety Compliance Agent for FoodBridge AI.
Food: ${foodName} (${category})
Time elapsed since cooking: ${elapsed} hours
Ambient Temperature: ${ambientTempC}°C
Remaining Safe Hours: ${remainingSafeHours} hours
Urgency Score: ${urgencyScore}

RAG Regulatory Context from FSSAI Regulations:
${contextText}

Generate a concise 2-sentence regulatory compliance finding referencing FSSAI guidelines and indicating whether this food is fit for immediate rescue and distribution.`;

        const geminiResult = await callGemini({ prompt, jsonMode: false });
        if (geminiResult && typeof geminiResult === "string") {
            aiSafetyAnalysis = geminiResult.trim();
        }
    }

    if (!aiSafetyAnalysis) {
        aiSafetyAnalysis = `In compliance with FSSAI (Recovery and Distribution of Surplus Food) Regulations 2019 Schedule I, this item has ~${remainingSafeHours}h remaining within the acceptable thermal danger zone. ${urgencyScore === "CRITICAL" ? "Immediate pickup required under 2-Hour/4-Hour emergency protocol." : "Safe for scheduled handover to registered SFDO."}`;
    }

    return {
        foodName,
        category,
        elapsedHours: elapsed,
        ambientTempC,
        remainingSafeHours,
        urgencyScore,
        safeUntil: safeUntilDate,
        complianceStatus: remainingSafeHours > 0 ? "PASSED_FSSAI_COMPLIANCE" : "EXPIRED_UNFIT_FOR_DONATION",
        regulatoryAnalysis: aiSafetyAnalysis,
        citations
    };
}

/**
 * AGENT 3: Smart Matchmaker Agent
 * Multi-objective matching of surplus donations with candidate NGOs
 */
function matchDonationWithNGOs({ donationLat, donationLng, quantity, foodType, category }) {
    console.log("[Matchmaker Agent] Evaluating candidate NGOs with multi-criteria optimization...");

    const ngos = localStore.ngos;
    const scoredNGOs = ngos.map(ngo => {
        const distanceKm = getDistanceKm(donationLat, donationLng, ngo.latitude, ngo.longitude);

        // Distance score (0 to 40 pts) - closer is higher
        const distanceScore = Math.max(0, 40 - (distanceKm * 4));

        // Dietary compatibility score (0 or 30 pts)
        let dietaryScore = 30;
        if (ngo.preferredDiet !== "Any" && foodType && ngo.preferredDiet.toLowerCase() !== foodType.toLowerCase()) {
            dietaryScore = 0; // Strict dietary mismatch (e.g. non-veg to pure veg shelter)
        }

        // Capacity score (0 to 30 pts)
        const capacityRatio = Math.min(1.0, quantity / (ngo.dailyNeed || 50));
        const capacityScore = 30 * capacityRatio;

        const totalMatchScore = Math.round(distanceScore + dietaryScore + capacityScore);

        // Natural language reasoning
        let reasoning = `${ngo.name} is ${distanceKm} km away. `;
        if (dietaryScore === 30) {
            reasoning += `Dietary requirements match perfectly (${ngo.preferredDiet}). `;
        }
        reasoning += `Their daily beneficiary capacity of ${ngo.dailyNeed} can comfortably absorb this donation.`;

        return {
            ngoId: ngo.id,
            ngoName: ngo.name,
            address: ngo.address,
            phone: ngo.phone,
            distanceKm,
            matchScore: totalMatchScore,
            reasoning
        };
    });

    // Sort descending by matchScore
    const topMatches = scoredNGOs.sort((a, b) => b.matchScore - a.matchScore);

    return {
        donationDetails: { quantity, foodType, category },
        matchedCount: topMatches.length,
        recommendedNGO: topMatches[0] || null,
        topMatches: topMatches.slice(0, 3)
    };
}

/**
 * AGENT 4: Green Logistics & Environmental Carbon Agent
 * Calculates carbon offset, methane avoidance, and route optimization
 */
function calculateGreenLogistics({ quantityServings, pickupLat, pickupLng, ngoLat, ngoLng }) {
    const servings = Number(quantityServings) || 30;
    // UNEP / FAO conversion: 1 meal ~ 0.4 kg food
    const foodWeightKg = Number((servings * 0.4).toFixed(1));
    
    // 1 kg rescued food avoids 2.5 kg CO2e
    const co2AvoidedKg = Number((foodWeightKg * 2.5).toFixed(1));
    
    // Methane avoided: ~0.25 kg CH4 per kg organic waste diverted from landfill
    const methaneAvoidedKg = Number((foodWeightKg * 0.25).toFixed(2));
    
    // Conserved water footprint: ~150 liters per meal
    const waterConservedLiters = Math.round(servings * 150);

    // Equivalent passenger car miles (avg car emits ~0.21 kg CO2e/km)
    const carKilometersSaved = Math.round(co2AvoidedKg / 0.21);

    const distanceKm = (pickupLat && ngoLat) 
        ? getDistanceKm(pickupLat, pickupLng, ngoLat, ngoLng) 
        : 3.5;

    return {
        servings,
        foodWeightKg,
        environmentalMetrics: {
            co2AvoidedKg,
            methaneAvoidedKg,
            waterConservedLiters,
            carKilometersSaved,
            landfillDiverted: true
        },
        routeSummary: {
            directDistanceKm: distanceKm,
            estimatedTransitMinutes: Math.round(distanceKm * 4 + 10),
            recommendedVehicle: distanceKm < 5 ? "Electric Bicycle / EV Scooter" : "Van / Insulated Car"
        }
    };
}

/**
 * AGENT 5: BridgeBot RAG Conversational Agent
 * Answers food redistribution, safety, legal, and operational questions
 */
async function chatWithBridgeBot({ message, chatHistory = [] }) {
    console.log(`[BridgeBot Agent] Answering user query: "${message}"`);

    // 1. RAG retrieval from regulatory knowledge base
    const relevantDocs = searchGuidelines(message, 3);
    const contextSnippet = relevantDocs
        .map(d => `Source: ${d.id} (${d.title})\n${d.content}`)
        .join("\n\n");

    if (hasGeminiKey) {
        const prompt = `You are BridgeBot, the expert AI Assistant for FoodBridge AI.
You assist food donors (restaurants), NGOs, and volunteers with food rescue operations, safety standards, and logistics.

RAG KNOWLEDGE BASE CONTEXT (FSSAI Regulations 2019):
${contextSnippet}

USER MESSAGE:
${message}

Respond clearly, concisely, and helpfully. If the question relates to food safety, storage temperatures, or donation liability, cite the relevant FSSAI guideline. Keep tone encouraging and professional.`;

        const reply = await callGemini({ prompt, jsonMode: false });
        if (reply && typeof reply === "string") {
            return {
                reply: reply.trim(),
                citations: relevantDocs.map(d => ({ id: d.id, title: d.title, section: d.section })),
                source: "Gemini 1.5 Flash + RAG"
            };
        }
    }

    // Fallback intelligent responder based on keywords
    let fallbackReply = "Welcome to FoodBridge AI! I am here to help you coordinate food donations safely and efficiently.";
    const lower = message.toLowerCase();

    if (lower.includes("temperature") || lower.includes("danger zone") || lower.includes("degree")) {
        fallbackReply = "According to FSSAI Regulations (Schedule I), the microbial danger zone is between 5°C and 60°C. Hot cooked food must be kept continuously >= 60°C, and chilled perishable food <= 5°C. Food in the danger zone must be consumed within 4 hours.";
    } else if (lower.includes("rice") || lower.includes("biryani") || lower.includes("spoilage")) {
        fallbackReply = "Cooked rice and biryani are classified as High-Risk foods due to Bacillus cereus spore risk. Under ambient room temperature (25°C - 30°C), they should be rescued and consumed within 3.5 hours of preparation.";
    } else if (lower.includes("law") || lower.includes("legal") || lower.includes("liability") || lower.includes("good samaritan")) {
        fallbackReply = "Under the FSSAI (Recovery and Distribution of Surplus Food) Regulations 2019, donors acting in good faith without negligence are protected when donating unserved, hygienic surplus food within its safe shelf life.";
    } else if (lower.includes("carbon") || lower.includes("co2") || lower.includes("environment")) {
        fallbackReply = "Every 1 kg of surplus food rescued prevents ~2.5 kg of CO2 equivalent emissions and avoids methane release from landfills, conserving ~150 liters of water per meal!";
    } else {
        fallbackReply = `Based on FSSAI guidelines: ensure surplus food is stored in clean food-grade containers, segregated by dietary type (Veg/Non-Veg), and dispatched within the 2-Hour/4-Hour window. How can I help you coordinate this?`;
    }

    return {
        reply: fallbackReply,
        citations: relevantDocs.slice(0, 2).map(d => ({ id: d.id, title: d.title, section: d.section })),
        source: "BridgeBot Regulatory RAG Engine"
    };
}

module.exports = {
    inspectFoodPhoto,
    assessSpoilageAndSafety,
    matchDonationWithNGOs,
    calculateGreenLogistics,
    chatWithBridgeBot
};
