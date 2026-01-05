import { InferenceClient } from "@huggingface/inference";

// 1. Initialize the Client
const client = new InferenceClient(import.meta.env.VITE_HF_TOKEN);

export const analyzeEmotion = async (text: string) => {
  try {
    console.log("Calling Hugging Face SDK...");

    // 2. Call the API using the official method
    const result = await client.textClassification({
      model: "j-hartmann/emotion-english-distilroberta-base",
      inputs: text,
      provider: "hf-inference", // Optional, but explicitly selects the hosted API
    });

    console.log("AI Output:", result);

    // 3. Transform the Array to an Object
    // The SDK returns: [{ label: 'joy', score: 0.9 }, { label: 'sadness', score: 0.05 }, ...]
    const scores: Record<string, number> = {};
    
    // Safety check: ensure result is an array
    if (Array.isArray(result)) {
      result.forEach((item) => {
        scores[item.label] = item.score;
      });
    }

    // 4. Return formatted data
    return {
      joy: scores['joy'] || 0,
      sadness: scores['sadness'] || 0,
      fear: scores['fear'] || 0,
      surprise: scores['surprise'] || 0,
      anger: scores['anger'] || 0,
    };

  } catch (error) {
    console.error("Emotion SDK Failed:", error);
    
    // Fallback in case of network error or "model loading" timeouts
    return { joy: 0, sadness: 0, fear: 0, surprise: 0, anger: 0 };
  }
};