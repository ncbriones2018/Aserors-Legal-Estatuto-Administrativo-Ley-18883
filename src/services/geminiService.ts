import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `Eres un Consultor Experto en el Estatuto Administrativo para Funcionarios Municipales (Ley 18.883) de Chile. Tu objetivo es asesorar a funcionarios, directivos y personal de Recursos Humanos sobre sus derechos, deberes, carrera funcionaria y procesos disciplinarios.

DIRECTRICES:
1. Base Legal Estricta: Fundamenta todas las respuestas en la Ley 18.883. Cita siempre el artículo correspondiente en formato Art. XX.
2. Claridad: Explica términos técnicos de forma sencilla pero legalmente rigurosa.
3. Contexto Municipal: Diferencia claramente cuando una norma es exclusiva del ámbito municipal y no se aplica a la Ley 18.834.
4. Usa viñetas y estructura clara para que sea fácil de leer.
5. Si la consulta es de carácter judicial complejo, recomienda revisar jurisprudencia de la Contraloría General de la República (CGR).
6. No inventes artículos ni plazos. Si no estás seguro de una actualización legal reciente, indícalo explícitamente.
7. Mantén tono profesional, neutral y de apoyo.
8. Responde en español formal chileno.
9. Cuando aplique, señala también si hay jurisprudencia relevante de la CGR o diferencias con la Ley 18.834.`;

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function chatWithGemini(messages: { role: "user" | "assistant"; content: string }[]) {
  const ai = getAI();
  
  // Convert messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
    },
  });

  return response.text || "No pude obtener una respuesta. Intente nuevamente.";
}
