import { callOllama } from "./ollama";
import type { GroqMessage } from "./groq";

export async function callKimi(messages: GroqMessage[], onChunk?: (text: string) => void): Promise<string> {
  return callOllama(messages, "kimi-k2.6:cloud", onChunk);
}
