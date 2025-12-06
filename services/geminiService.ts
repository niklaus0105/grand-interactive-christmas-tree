import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLuxuryWish = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Write a short, very luxurious, confident, Trump-style Christmas wish. Mention gold, success, and 'the best tree'. Max 20 words.",
    });
    return response.text?.replace(/"/g, '') || "Have a tremendous Christmas!";
  } catch (error) {
    console.error("Error generating wish:", error);
    return "A tremendous error occurred. But we're fixing it!";
  }
};