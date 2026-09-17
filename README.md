# MetricNumero

An AI-powered pharmaceutical batch record compliance agent that helps process and analyze batch records using advanced NLP and embedding technologies.

## Features

- **AI-Powered Analysis**: Uses Groq LLM and HuggingFace embeddings for intelligent batch record processing
- **OCR Capabilities**: Extract text from images and documents
- **Modern Tech Stack**: Built with React, TypeScript, Vite, shadcn-ui, and Tailwind CSS

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn-ui + Tailwind CSS
- **AI/ML**: 
  - Groq LLM (Llama 3.3 70B Versatile)
  - HuggingFace BGE Embeddings
  - Ollama for local embeddings

## Getting Started

```sh
# Clone the repository
git clone https://github.com/jpmn01230-lab/pharma-AI-.git

# Navigate to frontend
cd frontend
`
# Install dependencies
npm install

# Create .env file with your API keys
# See .env.example for required variables

# Start development server
npm run dev
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_GROQ_API_KEY=your_groq_api_key
VITE_HF_TOKEN=your_huggingface_token
```

## License

MIT

# Backend Services

This directory is reserved for backend services, APIs, and server-side logic for the MetricNumero platform.

## Proposed Structure
- `api/` - Fastify or Express endpoints
- `services/` - Business logic and AI orchestrations
- `db/` - Database schemas and migrations
