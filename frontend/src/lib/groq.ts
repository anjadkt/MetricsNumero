// Groq API helper — calls the Groq chat completions endpoint directly via fetch.

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "openai/gpt-oss-20b";
const MODEL = DEFAULT_GROQ_MODEL;

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGroq(
  messages: GroqMessage[], 
  options?: { apiKey?: string; model?: string; onChunk?: (text: string) => void }
): Promise<string> {
  const apiKey = options?.apiKey || GROQ_API_KEY;
  const model = options?.model || MODEL;
  const onChunk = options?.onChunk;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 8192,
      stream: !!onChunk,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  if (onChunk) {
    if (!response.body) throw new Error("No response body");
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]" || !data.trim()) continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            fullText += content;
            onChunk(fullText);
          } catch (e) {
            // Partial JSON
          }
        }
      }
    }
    return fullText;
  } else {
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "No response received.";
  }
}
