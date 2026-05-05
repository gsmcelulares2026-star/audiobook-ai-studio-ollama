# 📚 Audiobook AI Studio - Ollama Edition

Transform PDFs into interactive audiobooks using **local AI** with Ollama. No cloud APIs required. Pure local processing.

## ✨ Features

- **PDF to Audiobook**: Upload a PDF and automatically structure it into chapters
- **Local AI Processing**: Uses Ollama (llama2 by default) for intelligent text structuring
- **Local Text-to-Speech**: Generate audio locally using system TTS
- **Beautiful Web Interface**: Modern, responsive UI for managing and playing audiobooks
- **Zero Cloud Dependencies**: Everything runs locally on your machine

## 🛠️ Prerequisites

- **Node.js** 18+ 
- **Ollama** installed and running locally ([Download](https://ollama.ai))

## 🚀 Quick Start

### 1. Clone and setup

```bash
git clone https://github.com/gsmcelulares2026-star/audiobook-ai-studio-ollama.git
cd audiobook-ai-studio-ollama
npm install
```

### 2. Start Ollama

In one terminal, start the Ollama service:

```bash
ollama serve
```

### 3. Pull a model (first time only)

In another terminal:

```bash
ollama pull llama2
```

### 4. Run the app

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## ⚙️ Configuration

### Environment Variables

Create or edit `.env` to customize:

```env
OLLAMA_HOST=127.0.0.1        # Ollama server host
OLLAMA_PORT=11434            # Ollama server port
OLLAMA_MODEL=llama2          # Model to use (e.g., mistral, neural-chat)
```

## 📖 How It Works

1. **Upload PDF** → Extract text from your PDF file
2. **AI Structuring** → Ollama analyzes text and creates chapters
3. **Generate Audio** → Local TTS converts chapters to audio
4. **Play & Manage** → Listen, adjust content, and export

## 🎨 UI Features

- Real-time chapter navigation
- Audio playback controls (play, pause, speed control)
- Chapter editing
- Audio export
- Voice selection (system-dependent)

## 🔧 Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Check TypeScript
npm run clean     # Clean build artifacts
```

## 📦 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Motion
- **Backend**: Express, Node.js
- **AI**: Ollama (local inference)
- **PDF Processing**: pdf-parse
- **TTS**: System text-to-speech (`say` package)

## 🌐 Deployment

This project is designed to run locally. For deployment options, consider:
- Docker containerization
- Self-hosted VPS
- Local network serving

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to open issues and PRs.
