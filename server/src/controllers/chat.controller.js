import { generateGeminiResponse } from "../services/gemini.service.js";

export async function chatController(req, res) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const answer = await generateGeminiResponse(message);

    return res.status(200).json({
      success: true,
      data: {
        question: message.replace(/\s+/g," "),
        answer,
      },
    });
  } catch (error) {
    console.error("Chat controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate Gemini response",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
}