import { GoogleGenAI } from "@google/genai";

export const chatWithAi = async (req, res, next) => {
  try {
    const { message } = req.body;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",
      input: message,
    });

    return res.status(200).json({
      success: true,
      message: interaction.output_text,
    });
  } catch (error) {
    console.error("Gemini AI Error:", error);

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: "AI request limit reached. Please try again later.",
      });
    }

    if (error.status === 503) {
      return res.status(503).json({
        success: false,
        message:
          "AI service is temporarily unavailable. Please try again later.",
      });
    }

    next(error);
  }
};