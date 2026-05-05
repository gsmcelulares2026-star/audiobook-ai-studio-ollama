import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import fileUpload from "express-fileupload";
import cors from "cors";
import say from "say";
import { PDFParse } from "pdf-parse";

function extractJsonFromText(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/\{[\s\S]*\}$/);
  return match ? match[0] : trimmed;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(fileUpload({
    limits: { fileSize: 200 * 1024 * 1024 },
  }));

  // API Route: PDF Extraction
  app.post("/api/extract", async (req, res) => {
    try {
      if (!req.files || !req.files.pdf) {
        return res.status(400).json({ error: "No PDF uploaded" });
      }

      const pdfFile = req.files.pdf as any;
      const parser = new PDFParse({ data: pdfFile.data });
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();

      res.json({
        text: textResult.text,
        metadata: infoResult.metadata,
        pages: textResult.total,
      });
    } catch (error: any) {
      console.error("PDF Extraction error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/structure", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Missing text to structure" });
      }

      const ollamaHost = process.env.OLLAMA_HOST ?? "127.0.0.1";
      const ollamaPort = process.env.OLLAMA_PORT ?? "11434";
      const ollamaModel = process.env.OLLAMA_MODEL ?? "llama2";

      const prompt = `Structure the following raw text from a PDF into an audiobook format.\n1. Identify the book title.\n2. Split the content into logical chapters.\n3. Clean the text: remove headers, footers, page numbers, and fix hyphenation.\n4. Ensure the output is a valid JSON object with keys \"title\" and \"chapters\". Each chapter must have id, title, and content fields.\n\nRESPOND ONLY WITH VALID JSON, no extra text.\n\nTEXT:\n${text.slice(0, 30000)}`;

      const response = await fetch(`http://${ollamaHost}:${ollamaPort}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error("Ollama structure error:", body);
        return res.status(500).json({ error: "Failed to generate structure from Ollama" });
      }

      const result = await response.json();
      const output = result.response ?? "";

      const rawJson = extractJsonFromText(output);
      const structured = JSON.parse(rawJson);
      return res.json(structured);
    } catch (error: any) {
      console.error("Ollama structure exception:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Missing text to convert to speech" });
      }

      const tempDir = path.join(process.cwd(), "tmp");
      const tempFile = path.join(tempDir, `${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);
      await fs.promises.mkdir(tempDir, { recursive: true });

      await new Promise<void>((resolve, reject) => {
        say.export(text, voice || undefined, 1.0, tempFile, (err: any) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const audioBuffer = await fs.promises.readFile(tempFile);
      await fs.promises.unlink(tempFile).catch(() => null);

      const base64Audio = audioBuffer.toString("base64");
      res.json({ audioUrl: `data:audio/wav;base64,${base64Audio}` });
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ error: "Failed to generate speech locally" });
    }
  });

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
