import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

if (!apiKey) {
  console.warn("Missing Google API Key");
}

const genAI = new GoogleGenerativeAI(apiKey);

// ✅ CHANGE MODEL HERE
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

export const getEmbedding = async (text: string) => {
  try {
    const result = await model.embedContent(text);

    const embedding = result.embedding.values;

    // 🧪 temporary debug (recommended once)
    console.log("Embedding size:", embedding.length);

    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
};