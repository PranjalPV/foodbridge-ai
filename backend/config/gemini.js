require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Call Gemini Flash via Google Generative AI REST API
 * Supports multimodal (image base64 + text prompt) and structured JSON output
 */
async function callGemini({ prompt, imageBase64 = null, mimeType = "image/jpeg", jsonMode = true }) {
    if (!GEMINI_API_KEY) {
        return null;
    }

    // gemini-3.8-flash
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${GEMINI_API_KEY}`;

    const parts = [];

    if (imageBase64) {
        // Strip out data URL prefix if present (e.g. data:image/png;base64,)
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
        parts.push({
            inline_data: {
                mime_type: mimeType,
                data: cleanBase64
            }
        });
    }

    parts.push({ text: prompt });

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: parts
            }
        ],
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024
        }
    };

    if (jsonMode) {
        requestBody.generationConfig.responseMimeType = "application/json";
    }

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Gemini API Error] HTTP ${response.status}:`, errText);
            return null;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (jsonMode && candidate) {
            try {
                return JSON.parse(candidate);
            } catch (pErr) {
                console.warn("[Gemini JSON Parse Error] Raw text:", candidate);
                return { rawResponse: candidate };
            }
        }

        return candidate;
    } catch (error) {
        console.error("[Gemini Connection Error]:", error.message);
        return null;
    }
}

module.exports = {
    callGemini,
    hasGeminiKey: Boolean(GEMINI_API_KEY)
};
