
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAIMove = async (board: (string | null)[], aiSymbol: string, userSymbol: string) => {
  const prompt = `
    You are playing Tic-Tac-Toe. 
    Current board state: ${JSON.stringify(board)}
    Your symbol: ${aiSymbol}
    Opponent's symbol: ${userSymbol}
    Board indices:
    0 | 1 | 2
    ---------
    3 | 4 | 5
    ---------
    6 | 7 | 8
    
    Think strategically and pick the best empty index (0-8).
    Return ONLY the index as an integer.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            move: { type: Type.INTEGER, description: "The index to place your symbol" }
          },
          required: ["move"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data.move as number;
  } catch (error) {
    console.error("AI Move failed:", error);
    // Fallback: Pick first empty index
    return board.findIndex(cell => cell === null);
  }
};

export const getAICommentary = async (board: (string | null)[], lastMove: number, name: string) => {
  const prompt = `
    The user ${name} just made a move at index ${lastMove} on a Tic-Tac-Toe board: ${JSON.stringify(board)}.
    Act as a witty, slightly competitive AI partner in a virtual shack. 
    Give a short (max 15 words) reaction to their move.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    return "Nice move! Let's see what I can do.";
  }
};
