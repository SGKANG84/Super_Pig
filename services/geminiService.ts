
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const LEVEL_THEMES: Record<number, string> = {
  1: "The Evil Wolves are invading",
  2: "Super Pig is fighting Wolf clones",
  3: "Wolves in the sewers",
  4: "Robo-Wolves are attacking",
  5: "Flying Wolves with jetpacks",
  6: "A swarm of Mini-Wolves",
  7: "The Wolf Pack has united",
  8: "Unbreakable Wolf Fortress",
  9: "Total Wolf Chaos",
  10: "The Alpha Wolf Boss Battle"
};

export async function getLevelIntro(level: number): Promise<string> {
  // Fallback if no key is present (dev mode safety)
  if (!process.env.API_KEY) {
    const fallbackTheme = LEVEL_THEMES[level] || "Villains attacking";
    return `Level ${level}: ${fallbackTheme}! Super Pig to the rescue!`;
  }

  const theme = LEVEL_THEMES[level] || "A mysterious villain appears";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, funny, comic-book narrator intro (max 25 words) for Level ${level} of a "Super Pig vs Evil Wolves" pinball game.
      Scenario: ${theme}.
      Style: Exciting, using words like "Oink", "Howl", "Epic", or sound effects like "KA-BLAM!". 
      Target Audience: 9 year old kids.
      Make it sound like a dramatic comic book narration box.`,
    });
    
    return response.text ? response.text.trim() : `Level ${level}: ${theme}!`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Graceful fallback
    return `Level ${level}: Super Pig must stop ${theme}!`;
  }
}
