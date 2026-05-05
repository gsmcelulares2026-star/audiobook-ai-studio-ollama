export interface Chapter {
  id: string;
  title: string;
  content: string;
  audioUrl?: string;
}

export interface StructuredBook {
  title: string;
  chapters: Chapter[];
}

async function requestApi<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API request failed: ${response.status}`);
  }

  return response.json();
}

export async function structurePDFContent(rawText: string): Promise<StructuredBook> {
  const data = await requestApi<{ title: string; chapters: Chapter[] }>("/api/structure", {
    text: rawText,
  });
  return data;
}

export async function generateSpeech(text: string, voice: string = "Kore"): Promise<string | undefined> {
  const data = await requestApi<{ audioUrl?: string }>("/api/tts", {
    text,
    voice,
  });
  return data.audioUrl;
}
