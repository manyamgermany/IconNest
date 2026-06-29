import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { withRetry } from "@/lib/gemini";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, websiteUrl } = await req.json();

    const prompt = `You are an expert brand analyst and UI/UX designer.
Analyze the provided brand assets (logo image and/or website URL).
Extract the following information and return ONLY valid JSON:
- brandName: Infer from the logo or URL, or return a placeholder if unknown.
- dominantColors: Array of hex codes for dominant colors (max 3).
- accentColors: Array of hex codes for accent colors (max 2).
- visualTone: A short phrase describing the visual tone (e.g., "Professional & Trustworthy").
- lineStyle: Inferred stroke style (e.g., "1.5px", "2px", "bold").
- cornerRadius: Inferred corner preference (e.g., "sharp", "4px rounded", "pill").
- brandPersonality: A short description of the brand personality.
- suggestedStyles: An array of styles that best fit this brand, chosen ONLY from this list: ["Contemporary", "Modern", "Elegant", "Professional", "Clean", "Minimal", "Premium", "Technical", "Rounded", "Sharp", "Outline", "Filled", "Two-tone", "Gradient", "Playful", "Corporate"]. (Max 5)

Website URL provided: ${websiteUrl || 'None'}
`;

    const contents: any[] = [prompt];
    
    if (imageBase64) {
      const parts = imageBase64.split(',');
      if (parts.length === 2) {
        const mimeType = parts[0].split(';')[0].split(':')[1];
        const base64Data = parts[1];
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }
    }

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
      },
    }));

    const text = response.text || '{}';
    const analysis = JSON.parse(text);
    
    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("Error analyzing brand:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze brand" }, { status: 500 });
  }
}
