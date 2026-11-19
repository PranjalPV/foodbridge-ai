const fs = require("fs");
const path = require("path");

// Load the FSSAI Food Safety regulations corpus
const knowledgeBasePath = path.join(__dirname, "..", "data", "knowledge_base", "fssai_regulations.json");
let knowledgeCorpus = [];

try {
    const rawData = fs.readFileSync(knowledgeBasePath, "utf-8");
    const parsed = JSON.parse(rawData);
    knowledgeCorpus = parsed.documents || [];
    console.log(`[RAG Service] Loaded ${knowledgeCorpus.length} regulatory knowledge documents.`);
} catch (err) {
    console.warn(`[RAG Service] Could not load knowledge corpus: ${err.message}`);
}

/**
 * Tokenizes and calculates term frequencies for BM25/TF-IDF similarity
 */
function tokenize(text) {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(t => t.length > 2);
}

function calculateCosineSimilarity(queryTokens, docTokens) {
    const querySet = new Set(queryTokens);
    if (querySet.size === 0 || docTokens.length === 0) return 0;

    const docFreq = {};
    for (const t of docTokens) {
        docFreq[t] = (docFreq[t] || 0) + 1;
    }

    let dotProduct = 0;
    for (const t of querySet) {
        if (docFreq[t]) {
            dotProduct += docFreq[t];
        }
    }

    const docMagnitude = Math.sqrt(Object.values(docFreq).reduce((acc, v) => acc + v * v, 0));
    const queryMagnitude = Math.sqrt(querySet.size);

    return dotProduct / (queryMagnitude * docMagnitude || 1);
}

/**
 * Retrieve top relevant guidelines using semantic & keyword matching
 * @param {string} query - The query or food description
 * @param {number} topK - Number of top documents to return
 */
function searchGuidelines(query, topK = 3) {
    if (!knowledgeCorpus.length) return [];

    const queryTokens = tokenize(query);

    const scored = knowledgeCorpus.map(doc => {
        const fullDocText = `${doc.title} ${doc.content} ${(doc.keywords || []).join(" ")}`;
        const docTokens = tokenize(fullDocText);
        
        let score = calculateCosineSimilarity(queryTokens, docTokens);

        // Boost score if keyword directly matches
        for (const kw of (doc.keywords || [])) {
            if (query.toLowerCase().includes(kw.toLowerCase())) {
                score += 0.25;
            }
        }

        return {
            id: doc.id,
            title: doc.title,
            section: doc.section,
            category: doc.category,
            content: doc.content,
            score: Number(score.toFixed(4))
        };
    });

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}

/**
 * Formats retrieved chunks as context for LLM prompts
 * @param {string} foodName 
 * @param {string} category 
 * @returns {object} { contextText, citations }
 */
function getSafetyContextForDonation(foodName, category = "") {
    const query = `${foodName} ${category} temperature holding shelf life risk danger zone`;
    const relevantDocs = searchGuidelines(query, 3);

    const contextText = relevantDocs
        .map((doc, i) => `[Document ${i + 1} - ${doc.id} (${doc.title}, ${doc.section})]:\n${doc.content}`)
        .join("\n\n");

    const citations = relevantDocs.map(d => ({
        id: d.id,
        title: d.title,
        section: d.section
    }));

    return { contextText, citations, docs: relevantDocs };
}

module.exports = {
    searchGuidelines,
    getSafetyContextForDonation,
    knowledgeCorpus
};
