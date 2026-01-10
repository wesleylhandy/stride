# @stride/ai-gateway

AI integration service for Stride, providing a gateway to LLM services for issue triage and analysis.

## Overview

This package provides a service that acts as a gateway between Stride and various LLM providers (OpenAI, Anthropic, local LLMs via Ollama).

## Installation

```bash
pnpm add @stride/ai-gateway
```

## Usage

The AI gateway is typically run as a separate service. It provides HTTP endpoints for AI operations.

### Starting the Service

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

## Environment Variables

```env
# LLM Configuration
LLM_ENDPOINT=http://localhost:11434  # Ollama endpoint
OPENAI_API_KEY=sk-...                # OpenAI API key (optional)
ANTHROPIC_API_KEY=sk-ant-...         # Anthropic API key (optional)

# Service Configuration
NODE_ENV=development
PORT=3001
```

## API Endpoints

### POST /analyze-issue

Analyze an issue and provide triage suggestions.

**Request:**
```json
{
  "issue": {
    "title": "Bug in login flow",
    "description": "...",
    "errorContext": "..."
  }
}
```

**Response:**
```json
{
  "summary": "Brief summary",
  "priority": "high",
  "suggestedAssignee": "user-id",
  "suggestedLabels": ["bug", "authentication"]
}
```

## Features

- **Multi-provider support**: Works with OpenAI, Anthropic, or local LLMs
- **Privacy-first**: Can run with local LLMs (Ollama) for on-premise deployments
- **Issue triage**: Analyzes issues and suggests priority, assignment, labels
- **Error analysis**: Analyzes error contexts from monitoring tools

## Development

```bash
# Development mode with hot reload
pnpm dev

# Build
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint
```

## Docker

The service can be run in Docker:

```bash
docker build -t stride-ai-gateway packages/ai-gateway
docker run -p 3001:3001 stride-ai-gateway
```

## Integration

The service is integrated into the main Stride application via environment variable:

```env
AI_GATEWAY_URL=http://ai-gateway:3001
```

The main application makes HTTP requests to this service for AI operations.

## Local LLM Setup

For local LLM support using Ollama:

1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama2`
3. Set `LLM_ENDPOINT=http://localhost:11434`
4. Start the AI gateway service

## Security

- No sensitive data is sent to external services when using local LLMs
- API keys are stored as environment variables (never in code)
- The service validates all inputs before processing

## Future Enhancements

- Support for additional LLM providers
- Caching of analysis results
- Batch processing capabilities
- Custom prompt templates
