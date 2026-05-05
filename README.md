# 📚 Audiobook AI Studio - Edição Ollama

Transforme PDFs em audiolivros interativos usando **IA local** com Ollama. Sem APIs em nuvem. Processamento 100% local.

## ✨ Características

- **PDF para Audiobook**: Envie um PDF e estruture-o automaticamente em capítulos
- **Processamento com IA Local**: Usa Ollama (llama2 por padrão) para estruturação inteligente
- **Síntese de Voz Local**: Gere áudio localmente usando TTS do sistema
- **Interface Web Moderna**: UI responsiva e intuitiva para gerenciar e reproduzir audiolivros
- **Zero Dependências de Nuvem**: Tudo roda localmente na sua máquina

## 🛠️ Pré-requisitos

- **Node.js** 18+ 
- **Ollama** instalado e rodando localmente ([Baixar](https://ollama.ai))

## 🚀 Início Rápido

### 1. Clonar e configurar

```bash
git clone https://github.com/gsmcelulares2026-star/audiobook-ai-studio-ollama.git
cd audiobook-ai-studio-ollama
npm install
```

### 2. Iniciar Ollama

Em um terminal, inicie o serviço Ollama:

```bash
ollama serve
```

### 3. Baixar um modelo (primeira vez apenas)

Em outro terminal:

```bash
ollama pull llama2
```

### 4. Rodar a aplicação

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## ⚙️ Configuração

### Variáveis de Ambiente

Crie ou edite `.env` para customizar:

```env
OLLAMA_HOST=127.0.0.1        # Host do servidor Ollama
OLLAMA_PORT=11434            # Porta do servidor Ollama
OLLAMA_MODEL=llama2          # Modelo a usar (ex: mistral, neural-chat)
```

## 📖 Como Funciona

1. **Enviar PDF** → Extrai texto do seu arquivo PDF
2. **Estruturação com IA** → Ollama analisa o texto e cria capítulos
3. **Gerar Áudio** → TTS local converte capítulos em áudio
4. **Reproduzir e Gerenciar** → Ouça, edite conteúdo e exporte

## 🎨 Funcionalidades da Interface

- Navegação de capítulos em tempo real
- Controles de reprodução (play, pause, controle de velocidade)
- Edição de capítulos
- Exportação de áudio
- Seleção de voz (dependente do sistema)

## 🔧 Comandos

```bash
npm run dev       # Inicia servidor de desenvolvimento
npm run build     # Build para produção
npm run preview   # Pré-visualiza build de produção
npm run lint      # Verifica TypeScript
npm run clean     # Limpa artefatos de build
```

## 📦 Stack Tecnológico

- **Frontend**: React 19, Vite, Tailwind CSS, Motion
- **Backend**: Express, Node.js
- **IA**: Ollama (inferência local)
- **Processamento de PDF**: pdf-parse
- **TTS**: Text-to-speech do sistema (pacote `say`)

## 🌐 Deploy

Este projeto foi projetado para rodar localmente. Para opções de deploy, considere:
- Containerização com Docker
- VPS auto-hospedado
- Servindo em rede local

## 📝 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se livre para abrir issues e PRs.
