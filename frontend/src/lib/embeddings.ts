import { pipeline, env } from "@xenova/transformers";

export type TextChunk = {
  text: string;
  embedding: number[];
  sourceFile: string;
};

let embedderPipeline: any = null;

env.allowLocalModels = false;

export async function getEmbedding(text: string): Promise<number[]> {
  return (await getEmbeddings([text]))[0];
}

export async function getEmbeddings(texts: string[], onProgress?: (count: number) => void): Promise<number[][]> {
  const sfToken = import.meta.env.VITE_SILICONFLOW_API_KEY;
  const hfToken = import.meta.env.VITE_HF_TOKEN;
  
  // Primary Choice: SiliconFlow (Extremely Fast)
  if (sfToken && sfToken.length > 20) {
    try {
      return await getEmbeddingsSiliconFlow(texts, onProgress);
    } catch (err) {
      console.warn("SiliconFlow indexing failed, falling back:", err);
    }
  }

  // Secondary Choice: HuggingFace API
  if (hfToken && hfToken.startsWith("hf_")) {
    try {
      return await getEmbeddingsAPI(texts, onProgress);
    } catch (err) {
      console.warn("HF API indexing failed, falling back to local:", err);
    }
  }

  // Final Fallback: Local Transformers.js
  if (!embedderPipeline) {
    embedderPipeline = await pipeline("feature-extraction", "Xenova/bge-small-en-v1.5");
  }

  const results: number[][] = [];
  const batchSize = 10; // Increased from 5 for better local throughput

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, Math.min(i + batchSize, texts.length));
    const promises = batch.map(text => 
      embedderPipeline(text, { pooling: "mean", normalize: true })
    );
    
    const outputs = await Promise.all(promises);
    results.push(...outputs.map(output => Array.from(output.data as Float32Array)));
    if (onProgress) onProgress(results.length);
  }
  
  return results;
}

async function getEmbeddingsSiliconFlow(texts: string[], onProgress?: (count: number) => void): Promise<number[][]> {
  const token = import.meta.env.VITE_SILICONFLOW_API_KEY;
  const url = "https://api.siliconflow.cn/v1/embeddings";
  const model = "BAAI/bge-large-en-v1.5";
  
  const results: number[][] = [];
  const batchSize = 128; // Large batch for speed
  const concurrency = 12; // High parallel requests

  const batches = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    batches.push(texts.slice(i, Math.min(i + batchSize, texts.length)));
  }

  for (let i = 0; i < batches.length; i += concurrency) {
    const concurrentBatches = batches.slice(i, i + concurrency);
    const promises = concurrentBatches.map(async (batch) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, input: batch }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`SiliconFlow error ${response.status}: ${err}`);
      }

      const json = await response.json();
      return json.data.map((item: any) => item.embedding);
    });

    const outputs = await Promise.all(promises);
    for (const embeddings of outputs) {
      results.push(...embeddings);
    }
    if (onProgress) onProgress(results.length);
  }

  return results;
}

async function getEmbeddingsAPI(texts: string[], onProgress?: (count: number) => void): Promise<number[][]> {
  const token = import.meta.env.VITE_HF_TOKEN;
  const model = "sentence-transformers/all-MiniLM-L6-v2";
  const url = `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`;
  
  const results: number[][] = [];
  const batchSize = 64;
  const concurrency = 4; 

  const batches = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    batches.push(texts.slice(i, Math.min(i + batchSize, texts.length)));
  }

  for (let i = 0; i < batches.length; i += concurrency) {
    const concurrentBatches = batches.slice(i, i + concurrency);
    const promises = concurrentBatches.map(async (batch) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: batch, options: { wait_for_model: true } }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`HF API error ${response.status}: ${err}`);
      }

      const embeddings = await response.json();
      if (!Array.isArray(embeddings)) throw new Error("Invalid HF response");
      return embeddings;
    });

    const outputs = await Promise.all(promises);
    for (const embeddings of outputs) {
      results.push(...embeddings);
    }
    if (onProgress) onProgress(results.length);
  }

  return results;
}

export function chunkText(text: string, chunkSize: number = 600, overlap: number = 60): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  let i = 0;
  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize);
    chunks.push(chunkWords.join(" "));
    i += chunkSize - overlap;
  }

  return chunks;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function findRelevantChunks(query: string, allChunks: TextChunk[], topK: number = 5): Promise<TextChunk[]> {
  if (allChunks.length === 0) return [];

  const queryEmbedding = await getEmbedding(query);

  const scoredChunks = allChunks.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, topK).map(sc => sc.chunk);
}