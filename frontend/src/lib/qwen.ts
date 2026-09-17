import { callOllama } from "./ollama";
import type { GroqMessage } from "./groq";

export async function callQwen(messages: GroqMessage[], onChunk?: (text: string) => void): Promise<string> {
  return callOllama(messages, "qwen3.5:397b-cloud", onChunk);
}
