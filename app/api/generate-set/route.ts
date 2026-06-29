import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { withRetry } from "@/lib/gemini";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

export async function POST(req: NextRequest) {
  try {
    const { brandName, colors, visualTone, styles, iconsToGenerate, category } = await req.json();

    const prompt = `You are an expert SVG icon designer creating professional, crisp, and high-quality vector icons for an enterprise icon pack.
Your task is to generate a JSON array containing EXACTLY ${iconsToGenerate.length} icons.
Return ONLY valid JSON. The JSON should be an array of objects, where each object has a "name" string and an "svg" string containing the raw <svg> markup.

Brand Information:
- Brand Name / Tone: ${brandName || 'Generic'} - ${visualTone || 'Neutral'}
- Primary Colors: ${colors?.join(', ') || 'Monochrome (black/white)'}
- Selected Styles: ${styles?.join(', ') || 'Clean, Minimal'}
- Category: ${category || 'General'}

Icons to generate:
${iconsToGenerate.join(", ")}

Requirements for each SVG:
- ViewBox should be "0 0 24 24".
- Highly consistent stroke widths (e.g. 1.5px or 2px), corner radii, and negative space across all icons.
- Use current stroke and fill colors as instructed by the brand colors. If "Two-tone", use two colors.
- The SVG must be completely self-contained.
- Do not wrap the JSON in Markdown or any other text.`;

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a specialized SVG generator. You only output valid JSON arrays containing icon names and svg strings.",
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }));

    const text = response.text || '[]';
    const iconSet = JSON.parse(text);
    
    return NextResponse.json({ icons: iconSet });
  } catch (error: any) {
    console.error("Error generating icon set:", error);
    return NextResponse.json({ error: error.message || "Failed to generate icon set" }, { status: 500 });
  }
}
