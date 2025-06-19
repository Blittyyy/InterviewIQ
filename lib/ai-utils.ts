import { createServerSupabaseClient } from './supabase';

export interface AIRequestLog {
  user_id: string;
  report_id: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  response_time_ms: number;
  success: boolean;
  error_message?: string;
}

// OpenAI pricing rates (as of 2024)
const AI_RATES = {
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'gpt-4': { input: 0.03, output: 0.06 }
} as const;

export type AIModel = keyof typeof AI_RATES;

/**
 * Calculate the cost of an AI request based on token usage
 */
export const calculateAICost = (model: AIModel, inputTokens: number, outputTokens: number): number => {
  const rates = AI_RATES[model];
  const inputCost = (inputTokens * rates.input) / 1000;
  const outputCost = (outputTokens * rates.output) / 1000;
  return inputCost + outputCost;
};

/**
 * Determine which AI model to use based on user's subscription status and trial days left
 */
export const getModelForUser = (user: { subscription_status: string, trial_active?: boolean, trial_start_date?: string | null }): AIModel => {
  // Paid users always get GPT-4
  if (user.subscription_status === 'pro' || user.subscription_status === 'enterprise') {
    return 'gpt-4';
  }
  // Trial logic
  if (user.trial_active && user.trial_start_date) {
    const trialStart = new Date(user.trial_start_date);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = 7 - daysSinceStart;
    if (daysLeft > 4) {
      return 'gpt-4';
    } else {
      return 'gpt-3.5-turbo';
    }
  }
  // Default (should not be used, but fallback to GPT-3.5)
  return 'gpt-3.5-turbo';
};

/**
 * Log AI request details to the database for monitoring
 */
export const logAIRequest = async (logData: AIRequestLog): Promise<void> => {
  try {
    const supabase = createServerSupabaseClient();
    await supabase
      .from('ai_request_logs')
      .insert([logData]);
  } catch (error) {
    console.error('Failed to log AI request:', error);
    // Don't throw - logging failure shouldn't break the main flow
  }
};

/**
 * Generate AI report with fallback logic
 */
export const generateAIReport = async (
  openai: any,
  user: any,
  prompt: string,
  reportId: string
): Promise<{ data: any; summary: any; model: AIModel }> => {
  const preferredModel = getModelForUser(user);
  const startTime = Date.now();
  
  try {
    // First attempt with preferred model
    const completion = await openai.chat.completions.create({
      model: preferredModel,
      messages: [
        { role: "system", content: "You are an expert career coach and company research assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1800,
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;
    const cost = calculateAICost(preferredModel, inputTokens, outputTokens);

    // Log successful request
    await logAIRequest({
      user_id: user.id,
      report_id: reportId,
      model: preferredModel,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost,
      response_time_ms: responseTime,
      success: true,
    });

    // Parse and return the response
    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content || "{}");
    
    return {
      data: {
        basics: parsed.basics,
        products: parsed.products,
        news: parsed.news,
        culture: parsed.culture,
        competitors: parsed.competitors,
        talkingPoints: parsed.talkingPoints,
      },
      summary: parsed.summary,
      model: preferredModel,
    };

  } catch (error: any) {
    // If GPT-4 fails and user is paid, try GPT-3.5 Turbo as fallback
    if (preferredModel === 'gpt-4' && error.status !== 429) {
      console.log(`GPT-4 failed for user ${user.id}, falling back to GPT-3.5 Turbo`);
      
      try {
        const fallbackCompletion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: "system", content: "You are an expert career coach and company research assistant." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1800,
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const inputTokens = fallbackCompletion.usage?.prompt_tokens || 0;
        const outputTokens = fallbackCompletion.usage?.completion_tokens || 0;
        const cost = calculateAICost('gpt-3.5-turbo', inputTokens, outputTokens);

        // Log successful fallback request
        await logAIRequest({
          user_id: user.id,
          report_id: reportId,
          model: 'gpt-3.5-turbo',
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost,
          response_time_ms: responseTime,
          success: true,
          error_message: `Fallback from ${preferredModel}: ${error.message}`,
        });

        const content = fallbackCompletion.choices[0].message.content;
        const parsed = JSON.parse(content || "{}");
        
        return {
          data: {
            basics: parsed.basics,
            products: parsed.products,
            news: parsed.news,
            culture: parsed.culture,
            competitors: parsed.competitors,
            talkingPoints: parsed.talkingPoints,
          },
          summary: parsed.summary,
          model: 'gpt-3.5-turbo',
        };

      } catch (fallbackError: any) {
        // Log failed fallback attempt
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        await logAIRequest({
          user_id: user.id,
          report_id: reportId,
          model: 'gpt-3.5-turbo',
          input_tokens: 0,
          output_tokens: 0,
          cost: 0,
          response_time_ms: responseTime,
          success: false,
          error_message: `Fallback failed: ${fallbackError.message}`,
        });

        throw fallbackError;
      }
    }

    // Log failed request
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    await logAIRequest({
      user_id: user.id,
      report_id: reportId,
      model: preferredModel,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      response_time_ms: responseTime,
      success: false,
      error_message: error.message,
    });

    throw error;
  }
};