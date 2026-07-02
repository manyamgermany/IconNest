import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { withRetry } from "@/lib/gemini";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

export async function POST(req: NextRequest) {
  try {
    const { brandName, colors, visualTone, styles, useCase, complexity, extraComments } = await req.json();

    const complexityDesc = {
      1: "Ultra-minimal: extremely simplified, maximum 2-3 geometric primitives, thick readable strokes.",
      2: "Minimal: clean shapes, very few details.",
      3: "Standard: balanced complexity, standard UI icon level.",
      4: "Detailed: nuanced, features more linework or layered shapes.",
      5: "Intricate: highly detailed, complex illustrative vectors."
    }[complexity as 1|2|3|4|5] || "Standard: balanced complexity, standard UI icon level.";

    const prompt = `You are an expert SVG icon designer creating professional, crisp, and high-quality vector icons.
Your task is to generate a single SVG icon code for a brand. 
Return ONLY the raw SVG code. Do not include markdown code blocks (\`\`\`svg ... \`\`\`), no HTML wrappers, no explanations. 
Just the <svg> ... </svg> string.

Brand Information:
- Brand Name / Tone: ${brandName || 'Generic'} - ${visualTone || 'Neutral'}
- Primary Colors: ${colors?.join(', ') || 'Monochrome (black/white)'}
- Selected Styles: ${styles?.join(', ') || 'Clean, Minimal'}
- Visual Complexity: ${complexityDesc}
- Icon Use Case: ${useCase}
${extraComments ? `- Extra Comments / Regeneration instructions: ${extraComments}` : ''}

Requirements:
- The SVG must be completely self-contained.
- ViewBox should typically be "0 0 24 24" or "0 0 48 48" unless the style dictates otherwise.
- Use current stroke and fill colors as instructed by the brand colors. If styles specify "Two-tone", use two colors. If "Gradient", use a <linearGradient>.
- Stroke width should be consistent (e.g. 2px) unless "Filled" or "Sharp" style specifies otherwise.
- The SVG must be scalable and responsive.
- Only output the raw XML SVG text.`;

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a specialized SVG generator. You only output raw valid SVG markup.",
        temperature: 0.2, // Low temp for more consistent shapes
      },
    }));

    let svgText = response.text || '';
    
    // Clean up if the model accidentally wrapped it
    if (svgText.includes('<svg')) {
      svgText = svgText.substring(svgText.indexOf('<svg'));
      if (svgText.lastIndexOf('</svg>') !== -1) {
        svgText = svgText.substring(0, svgText.lastIndexOf('</svg>') + 6);
      }
    }
    
    return NextResponse.json({ svg: svgText });
  } catch (error: any) {
    console.error("Error generating icon:", error);
    return NextResponse.json({ error: error.message || "Failed to generate icon" }, { status: 500 });
  }
}
