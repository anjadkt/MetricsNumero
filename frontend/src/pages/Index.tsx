import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, Send, Trash2, Bot, User, ShieldCheck, AlertTriangle, Loader2, FileUp, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { callGroq, DEFAULT_GROQ_MODEL, type GroqMessage } from "@/lib/groq";
import { callKimi } from "@/lib/kimi";
import { callQwen } from "@/lib/qwen";
import { extractText } from "@/lib/extractText";
import { chunkText, findRelevantChunks, type TextChunk, getEmbeddings } from "@/lib/embeddings";
import { exportAsPdf, exportAsPpt } from "@/lib/export";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

type FileItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  extractedText?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AppStatus = "awaiting" | "processing" | "ready";

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${((bytes / 1024)).toFixed(1)} KB`;
  return `${((bytes / (1024 * 1024))).toFixed(1)} MB`;
};

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const ACCEPTED = ".pdf,.txt,.docx,.csv";

const SYSTEM_PROMPT = `CORE MISSION:
You are the MetricNumero Pharmaceutical Research Assistant, specialized in Batch Manufacturing Records (BMR) and Standard Operating Procedures (SOP). Your absolute priority is providing accurate, document-grounded answers to technical queries.

OPERATIONAL GUIDELINES:

1. ANSWER FROM DOCUMENTS: Every response must be derived from the provided document excerpts. If a user asks a specific question, answer it directly and professionally. Do not speak in generic terms if specific data is available. Focus on the uploaded records as your only source of truth.

2. MANDATORY TABLES: Whenever you encounter numerical values (weights, temperatures, times), equipment settings, processing limits, or comparisons between different products/batches, you MUST present them in a Markdown Table. This is non-negotiable for values and differentiation.

3. FINE-TUNED SYNTHESIS: Before responding, synthesize the information into a professional pharmaceutical report format. Ensure the tone is that of a senior auditor.

4. CITATION MANDATE: Always mention the specific document filename (e.g., "Ciprofloxacin_BMR.docx") when providing data or answering a query.

5. IDENTIFY DEVIATIONS: If the user asks about issues or deviations, use data cards (blockquotes) to highlight technical impact and root cause analysis derived from the text.

STYLE:
- Tone: Professional, Precise, Regulatory-Grade.
- Format: Bold headers, Markdown Tables for data, Blockquotes for critical findings.`;

const Index = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [allChunks, setAllChunks] = useState<TextChunk[]>([]);
  const [status, setStatus] = useState<AppStatus>("awaiting");
  const [aiModel, setAiModel] = useState<string>("groq-primary");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: FileItem[] = Array.from(fileList).map((f) => ({
      id: generateUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      file: f,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setStatus("awaiting");
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const detectDocType = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes("bmr") || lower.includes("batch")) return "BMR";
    if (lower.includes("capa")) return "CAPA";
    if (lower.includes("sop")) return "SOP";
    if (lower.includes("audit")) return "Audit Report";
    if (lower.includes("deviation")) return "Deviation Report";
    return "Document";
  };

  const processDocuments = async () => {
    if (files.length === 0) return;
    setStatus("processing");
    setIndexingProgress(0);

    const startTime = performance.now();
    
    try {
      const extractPromises = files.map(async (f) => {
        const text = await extractText(f.file);
        return { file: f, text };
      });
      
      const fileResults = await Promise.all(extractPromises);
      
      const chunksForEmbedding: string[] = [];
      const sourceFiles: string[] = [];
      
      let chunkIndex = 0;
      for (const result of fileResults) {
        const text = result.text;
        const sourceFile = `${detectDocType(result.file.name)}: ${result.file.name}`;
        const chunkStrings = chunkText(text, 1000, 100);
        
        for (const chunk of chunkStrings) {
          chunksForEmbedding.push(chunk);
          sourceFiles.push(sourceFile);
        }
        chunkIndex++;
      }
      
      if (chunksForEmbedding.length > 0) {
        setIndexingProgress(30);
        console.log("Getting embeddings for", chunksForEmbedding.length, "chunks...");
        
        try {
          const embeddings = await getEmbeddings(chunksForEmbedding, (count) => {
            setIndexingProgress(30 + Math.min(60, (count / chunksForEmbedding.length) * 60));
          });
          
          setIndexingProgress(90);
          
          const allChunks: TextChunk[] = chunksForEmbedding.map((text, i) => ({
            text,
            embedding: embeddings[i],
            sourceFile: sourceFiles[i] || "Document",
          }));
          
          console.log("Indexed", allChunks.length, "chunks successfully");
          setAllChunks(allChunks);
        } catch (embedErr) {
          console.error("Embedding error:", embedErr);
          setAllChunks([]);
        }
        
        const endTime = performance.now();
        const durationSec = ((endTime - startTime) / 1000).toFixed(1);
        
        setStatus("ready");
        setIndexingProgress(100);

        setMessages((prev) => [
          ...prev,
          {
            id: generateUUID(),
            role: "assistant",
            content: `I have successfully analyzed and semantically indexed ${files.length} documents in **${durationSec}s**. Every segment is now synchronized with my knowledge base. Feel free to ask any research query!`,
          },
        ]);
      } else {
        const endTime = performance.now();
        const durationSec = ((endTime - startTime) / 1000).toFixed(1);
        
        setFiles(files);
        setAllChunks([]);
        setStatus("ready");
        setIndexingProgress(100);

        setMessages((prev) => [
          ...prev,
          {
            id: generateUUID(),
            role: "assistant",
            content: `I have successfully analyzed and indexed ${files.length} documents in **${durationSec}s**. Ask your research questions!`,
          },
        ]);
      }
    } catch (err) {
      console.error("Global processing error:", err);
      setStatus("awaiting");
    } finally {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      setTimeout(() => setIndexingProgress(0), 3000);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setFiles([]);
    setAllChunks([]);
    setStatus("awaiting");
    setInput("");
  };

  const buildContext = async (query: string): Promise<string> => {
    if (allChunks.length === 0) return "[No context available]";
    
    try {
      const topChunks = await findRelevantChunks(query, allChunks, 15);
      return topChunks.map(c => `=== Source: ${c.sourceFile} ===\n${c.text}`).join("\n\n");
    } catch (err) {
      console.error("Context build error:", err);
      return "[Failed to retrieve source context.]";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || status !== "ready" || isTyping) return;

    const userMsg: Message = {
      id: generateUUID(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const docContext = await buildContext(userMsg.content);
      const systemWithDocs = `${SYSTEM_PROMPT}\n\n---\n\nYou have access to the following relevant document excerpts:\n\n${docContext}`;

      const history: GroqMessage[] = [
        { role: "system", content: systemWithDocs },
        ...messages
          .filter((m, i) => i > 0 || messages.length > 1) 
          .slice(-6)
          .map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
        { role: "user", content: userMsg.content },
      ];

      const assistantMsgId = generateUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: (aiModel === "groq-primary" || aiModel === "kimi" || aiModel === "qwen") ? "..." : "" },
      ]);

      const onChunk = (text: string) => {
        // Handle both <think> and <thinking> tags common in reasoning models
        let cleanText = text;
        
        const thinkEnd = text.lastIndexOf("</think>");
        const thinkingEnd = text.lastIndexOf("</thinking>");
        const lastEnd = Math.max(thinkEnd, thinkingEnd);

        if (lastEnd !== -1) {
          const tagLen = lastEnd === thinkEnd ? 8 : 11;
          cleanText = text.slice(lastEnd + tagLen).trim();
        } else if (text.includes("<think") || text.includes("<thinking")) {
          cleanText = "";
        }

        setMessages((prev) => 
          prev.map((m) => m.id === assistantMsgId 
            ? { ...m, content: cleanText || (text.includes("<think") ? "_Analysing documents... (thinking)_" : "...") } 
            : m
          )
        );
      };

      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (aiModel === "groq-primary") {
        await callGroq(history, { apiKey: groqApiKey, model: DEFAULT_GROQ_MODEL, onChunk });
      } else {
        try {
          if (aiModel === "kimi") {
            await callKimi(history, onChunk);
          } else if (aiModel === "qwen") {
            await callQwen(history, onChunk);
          }
        } catch (err) {
          console.warn("Selected AI provider failed, falling back to Groq:", err);
          await callGroq(history, { apiKey: groqApiKey, model: DEFAULT_GROQ_MODEL, onChunk });
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateUUID(),
          role: "assistant",
          content: `⚠️ **Error communicating with AI:** ${err instanceof Error ? err.message : "Unknown error occurred."}`,
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleExportPdf = (content: string) => {
    console.log("Exporting PDF...");
    try {
      exportAsPdf("MetricNumero Audit Report", content);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Failed to export PDF. Please try again.");
    }
  };

  const handleExportPpt = (content: string) => {
    console.log("Exporting PPT...");
    try {
      exportAsPpt("MetricNumero Audit Report", content);
    } catch (err) {
      console.error("PPT export error:", err);
      alert("Failed to export PPT. Please try again.");
    }
  };

  const isLongContent = (content: string) => content.length > 1500;

  return (
    <div className="flex h-screen bg-secondary/40">
      <aside className="w-72 flex-shrink-0 border-r border-border bg-background flex flex-col">
        <div className="p-5 border-b border-border flex items-center gap-3 bg-white">
          <div className="relative flex items-center justify-center w-10 h-10 shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden rounded-md">
            <div className="absolute inset-0 bg-white" />
            <svg viewBox="0 0 100 100" className="relative w-8 h-8">
              <circle cx="50" cy="50" r="32" className="fill-[#00E5FF]" />
              {[...Array(12)].map((_, i) => (
                <rect
                  key={i}
                  x="44" y="10" width="12" height="15" rx="2"
                  className="fill-[#00E5FF]"
                  transform={`rotate(${i * 30} 50 50)`}
                />
              ))}
              <circle cx="50" cy="50" r="22" className="fill-[#E0F7FA]" />
              {[-1, 0, 1].map(row => 
                [-1, 0, 1].map(col => (
                  <circle 
                    key={`${row}-${col}`} 
                    cx={50 + col * 9} 
                    cy={50 + row * 9} 
                    r="2.5" 
                    className="fill-[#00E5FF]" 
                  />
                ))
              )}
            </svg>
          </div>
          <h1 className="font-display text-2xl tracking-normal mt-0.5">
            <span className="text-gray-900 font-medium">Metric</span>
            <span className="text-[#00E5FF] font-medium">Numero</span>
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Upload Records
            </p>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed p-5 text-center transition-colors duration-200 cursor-pointer ${
                isDragging ? "border-primary bg-secondary" : "border-border bg-background hover:border-primary/40"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-body font-medium text-foreground">Drag &amp; drop files</p>
              <p className="text-xs text-muted-foreground mt-1 text-[10px]">BMR, SOP, CAPA, Audit Reports (PDF, TXT, DOCX, CSV)</p>
              <Button size="sm" className="mt-3">Browse files</Button>
              <input ref={fileInputRef} type="file" className="hidden" accept={ACCEPTED} multiple onChange={(e) => addFiles(e.target.files)} />
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Queued ({files.length})</p>
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-2 rounded-md border border-border bg-background p-2.5">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body font-medium text-foreground truncate">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatSize(f.size)} · {detectDocType(f.name)}
                      {f.extractedText && <span className="text-green-500 ml-1">✓ indexed</span>}
                    </p>
                  </div>
                  <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border space-y-3">
          {status === "processing" && (
            <div className="space-y-1.5 p-1">
              <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <span>Indexing Progress</span>
                <span>{Math.round(indexingProgress)}%</span>
              </div>
              <Progress value={indexingProgress} className="h-1" />
            </div>
          )}
          <Button className="w-full" disabled={files.length === 0 || status === "processing" || status === "ready"} onClick={processDocuments}>
            {status === "processing" ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Indexing Context...</span>
            ) : "Process Documents"}
          </Button>
          <Button variant="outline" className="w-full" onClick={clearConversation}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear Session
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">Pharmaceutical Compliance</h2>
            <p className="text-sm text-muted-foreground font-body">Deep-dive research into BMRs and SOPs</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                <SelectValue placeholder="AI Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groq-primary">Groq - GPT-OSS 20B</SelectItem>
                <SelectItem value="kimi">Kimi K2.6</SelectItem>
                <SelectItem value="qwen">Qwen 3.5 397B</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-primary/40 text-primary"><AlertTriangle className="w-3 h-3 mr-1" /> Deviations</Badge>
              <Badge variant="outline" className="text-xs border-accent/60 text-accent"><ShieldCheck className="w-3 h-3 mr-1" /> GMP</Badge>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl w-full">
                <StepCard step={1} title="Upload" description="Drop BMR or SOP records into the sidebar." />
                <StepCard step={2} title="Process" description="Parallel extraction and semantic indexing." />
                <StepCard step={3} title="Query" description="Professional compliance research." />
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-6 py-5 max-w-[95%] text-sm font-body leading-relaxed shadow-sm border ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground ml-auto border-primary/20" 
                        : "bg-white text-foreground border-border/40 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="relative">
                        {isLongContent(msg.content) && (
                          <div className="absolute top-0 right-0 flex gap-2 -mt-2 -mr-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs bg-white border-primary/40 hover:bg-primary/10"
                              onClick={() => handleExportPdf(msg.content)}
                            >
                              <FileUp className="w-3 h-3 mr-1" />
                              PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs bg-white border-primary/40 hover:bg-primary/10"
                              onClick={() => handleExportPpt(msg.content)}
                            >
                              <Presentation className="w-3 h-3 mr-1" />
                              PPT
                            </Button>
                          </div>
                        )}
                        <div className="prose prose-sm prose-slate max-w-none 
                          [&_h3]:text-primary [&_h3]:font-display [&_h3]:font-bold [&_h3]:mt-0 [&_h3]:mb-3 [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2
                          [&_blockquote]:border-l-4 [&_blockquote]:border-l-primary/60 [&_blockquote]:text-foreground [&_blockquote]:bg-slate-50 [&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:rounded-r-lg [&_blockquote]:my-5 [&_blockquote]:shadow-sm
                          [&_blockquote_p]:m-0 [&_blockquote_p+p]:mt-2
                          [&_code]:text-primary [&_code]:bg-primary/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[0.85em]
                          [&_table]:border-collapse [&_table]:w-full [&_table]:my-8 [&_table]:shadow-md [&_table]:rounded-lg [&_table]:overflow-hidden
                          [&_th]:border-b-2 [&_th]:border-border [&_th]:bg-slate-100/80 [&_th]:px-5 [&_th]:py-4 [&_th]:text-left [&_th]:font-display [&_th]:font-bold [&_th]:text-slate-800 [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-[0.75rem]
                          [&_td]:border-b [&_td]:border-border/50 [&_td]:px-5 [&_td]:py-4 [&_td]:text-slate-600 [&_td]:align-top [&_td]:leading-relaxed
                          [&_hr]:my-10 [&_hr]:border-border/60">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{"\n" + msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="rounded-lg px-4 py-3 bg-secondary text-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analyzing documents…</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-background">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={status === "ready" ? "Ask about deviations, CPPs, actions…" : "Upload records first…"}
              disabled={status !== "ready" || isTyping}
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <Button onClick={sendMessage} disabled={status !== "ready" || !input.trim() || isTyping} size="icon">
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

const StepCard = ({ step, title, description }: { step: number; title: string; description: string }) => (
  <div className="rounded-lg border border-border bg-background p-6 text-center shadow-md">
    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-display font-bold flex items-center justify-center mx-auto mb-3">{step}</div>
    <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground font-body">{description}</p>
  </div>
);

export default Index;
