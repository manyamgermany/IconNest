import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { withRetry } from "@/lib/gemini";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

export async function POST(req: NextRequest) {
  try {
    const { brandName, colors, visualTone, styles } = await req.json();

    const prompt = `You are an expert SVG icon designer creating professional, crisp, and high-quality vector assets for a brand kit.
Your task is to generate three separate SVGs for a brand kit based on the provided brand identity.
Return a JSON object containing EXACTLY three keys: "favicon", "avatar", and "palette".
Each key must map to a string containing the raw valid SVG code for that asset.

Brand Information:
- Brand Name / Tone: ${brandName || 'Generic'} - ${visualTone || 'Neutral'}
- Primary Colors: ${colors?.join(', ') || 'Monochrome (black/white)'}
- Selected Styles: ${styles?.join(', ') || 'Clean, Minimal'}

Requirements for Favicon (favicon):
- A minimal, simplified icon representation of the brand.
- Must be scalable and clear at very small sizes (e.g. 16x16 or 32x32).
- ViewBox should be "0 0 32 32".

Requirements for Social Media Avatar (avatar):
- A more detailed or stylized brand mark suited for a profile picture.
- ViewBox should be "0 0 512 512".
- Often includes a background color or a circular/squircle boundary if appropriate.

Requirements for Primary Brand Color Palette Image (palette):
- A visually appealing display of the brand's primary colors.
- ViewBox should be "0 0 400 200".
- Should showcase the colors as swatches or a gradient presentation with the brand name nicely typographic.

Return ONLY a valid JSON object matching the format:
{
  "favicon": "<svg>...</svg>",
  "avatar": "<svg>...</svg>",
  "palette": "<svg>...</svg>"
}
No markdown formatting, no explanations, just the JSON string.`;

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a specialized JSON and SVG generator. You only output a raw valid JSON object with string values containing valid SVG markup.",
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }));

    let jsonStr = response.text || '{}';
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON parse error on gemini response:", e);
      throw new Error("Invalid format returned by AI model.");
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error generating brand kit:", error);
    return NextResponse.json({ error: error.message || "Failed to generate brand kit" }, { status: 500 });
  }
}
