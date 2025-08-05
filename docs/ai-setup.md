# AI Features Setup Guide

This guide explains how to set up the AI-powered features for the Course Platform using OpenAI's API.

## Prerequisites

- OpenAI account with API access
- API key from OpenAI dashboard

## Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (you won't be able to see it again!)

## Step 2: Configure Environment Variables

Add your OpenAI API key to the environment variables:

```bash
# .env.local
OPENAI_API_KEY=sk-...your-key-here...
```

## Step 3: Verify Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to a lesson with MDX content
3. Test the AI features:
   - **AI Chat**: Ask questions about the lesson
   - **AI Explainer**: Hover over concepts marked with AIExplainer
   - **AI Code Review**: Submit code for AI review

## AI Features Overview

### 1. AI Chat Component
- Embedded chat interface in lessons
- Context-aware responses based on current lesson
- Conversation history within session
- Interactions saved to database for analytics

### 2. AI Explainer
- Hover-to-explain functionality
- Provides concise explanations of complex concepts
- Context-aware based on surrounding content

### 3. AI Code Review
- Analyzes code for best practices
- Identifies potential bugs and issues
- Provides improvement suggestions
- Language-specific recommendations

## API Endpoints

All AI features use Vercel Edge Functions for optimal performance:

- `/api/ai/chat` - Streaming chat responses
- `/api/ai/explain` - Concept explanations
- `/api/ai/review` - Code analysis
- `/api/ai/interactions` - Save user interactions

## Cost Management

### Token Usage
- Chat: ~500 tokens per response
- Explanations: ~300 tokens per request
- Code reviews: ~600 tokens per review

### Optimization Tips
1. Implement caching (Redis) for common questions
2. Set appropriate max_tokens limits
3. Use GPT-3.5-turbo for cost efficiency
4. Monitor usage through OpenAI dashboard

## Security Considerations

1. **API Key Protection**:
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Rate Limiting**:
   - Implement per-user rate limits
   - Add request throttling
   - Monitor for abuse

3. **Content Filtering**:
   - Validate user inputs
   - Filter inappropriate content
   - Log suspicious activities

## Troubleshooting

### Common Issues:

1. **"Unauthorized" errors**:
   - Check API key is correctly set
   - Verify environment variables are loaded
   - Ensure user is authenticated

2. **"Rate limit exceeded"**:
   - Implement request queuing
   - Add exponential backoff
   - Consider upgrading OpenAI plan

3. **Slow responses**:
   - Edge Functions provide fastest response
   - Consider implementing streaming
   - Add loading states for better UX

## Next Steps

1. **Add Redis Caching**:
   - Cache frequent queries
   - Reduce API costs
   - Improve response times

2. **Implement Analytics**:
   - Track popular questions
   - Monitor AI effectiveness
   - Optimize prompts based on usage

3. **Custom Fine-tuning**:
   - Train on course-specific content
   - Improve accuracy for domain topics
   - Create specialized models