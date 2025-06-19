# AI Integration Guide

## Cost Considerations

### Token Pricing (as of 2024)
- **GPT-3.5 Turbo**: ~$0.002/1K tokens
- **GPT-4**: ~$0.03/1K tokens (15x more expensive)

### Cost Impact
- A typical company report uses ~800-1200 tokens
- GPT-3.5 Turbo: ~$0.0016-0.0024 per report
- GPT-4: ~$0.024-0.036 per report

## Recommended Approach

### Model Selection Strategy
1. **Free/Trial users**: GPT-3.5 Turbo (faster, cheaper)
2. **Paid users**: GPT-4 (better quality, more detailed)
3. **Fallback**: If GPT-4 fails, fall back to GPT-3.5 Turbo

### Implementation Logic
```typescript
const getModelForUser = (user: User) => {
  if (user.subscription_status === 'active') {
    return 'gpt-4';
  }
  return 'gpt-3.5-turbo';
};
```

### Fallback Strategy
```typescript
const generateReport = async (user, prompt) => {
  const preferredModel = getModelForUser(user);
  
  try {
    return await openai.chat.completions.create({
      model: preferredModel,
      // ... other params
    });
  } catch (error) {
    if (preferredModel === 'gpt-4' && error.status !== 429) {
      // Fall back to GPT-3.5 Turbo for paid users
      return await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        // ... other params
      });
    }
    throw error;
  }
};
```

## Monitoring & Logging Recommendations

### 1. Request Logging
Log every AI request with:
- User ID and subscription status
- Model used (GPT-3.5 vs GPT-4)
- Input token count
- Output token count
- Total cost
- Response time
- Success/failure status
- Error details (if any)

### 2. Cost Tracking
```typescript
const logAICost = (model: string, inputTokens: number, outputTokens: number) => {
  const rates = {
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-4': { input: 0.03, output: 0.06 }
  };
  
  const cost = (inputTokens * rates[model].input / 1000) + 
               (outputTokens * rates[model].output / 1000);
  
  // Log to database or monitoring service
  console.log(`AI Cost: $${cost.toFixed(4)} for ${model}`);
};
```

### 3. Performance Metrics
Track:
- Average response time by model
- Success rate by model
- Token usage patterns
- Cost per user type (free vs paid)
- Daily/weekly/monthly cost trends

### 4. Error Monitoring
Monitor:
- Rate limit hits
- Quota exhaustion
- Network timeouts
- JSON parsing failures
- Model-specific errors

### 5. Database Schema for Monitoring
```sql
CREATE TABLE ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  report_id UUID REFERENCES reports(id),
  model VARCHAR(20) NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost DECIMAL(10,6) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Alerts & Notifications
Set up alerts for:
- Daily cost exceeding threshold
- High error rates (>5%)
- Rate limit frequency
- Unusual token usage patterns

### 7. Dashboard Metrics
Track in real-time:
- Current month's AI costs
- Requests per hour/day
- Average cost per user type
- Model usage distribution
- Error rate trends

## Implementation Priority

1. **Phase 1**: Basic model selection (GPT-3.5 for free, GPT-4 for paid)
2. **Phase 2**: Fallback logic for GPT-4 failures
3. **Phase 3**: Cost logging and monitoring
4. **Phase 4**: Advanced error handling and alerts
5. **Phase 5**: Performance optimization and caching

## Cost Control Strategies

### 1. Token Limits
- Set `max_tokens` to reasonable limits (1500-2000)
- Use shorter, more focused prompts
- Implement response truncation if needed

### 2. Caching
- Cache identical company requests
- Different cache TTL for different models
- Cache invalidation on company updates

### 3. Rate Limiting
- Implement per-user rate limits
- Monitor and adjust based on usage patterns
- Graceful degradation during high load

### 4. Progressive Enhancement
- Start with GPT-3.5 for all users
- Gradually roll out GPT-4 to paid users
- A/B test quality vs cost impact 