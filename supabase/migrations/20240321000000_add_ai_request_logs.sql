-- Create ai_request_logs table for monitoring AI usage and costs
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

-- Add indexes for better query performance
CREATE INDEX idx_ai_request_logs_user_id ON ai_request_logs(user_id);
CREATE INDEX idx_ai_request_logs_report_id ON ai_request_logs(report_id);
CREATE INDEX idx_ai_request_logs_created_at ON ai_request_logs(created_at);
CREATE INDEX idx_ai_request_logs_model ON ai_request_logs(model);
CREATE INDEX idx_ai_request_logs_success ON ai_request_logs(success);

-- Add RLS policies
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own logs
CREATE POLICY "Users can view their own AI request logs" ON ai_request_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to insert logs
CREATE POLICY "Service role can insert AI request logs" ON ai_request_logs
  FOR INSERT WITH CHECK (true);

-- Allow service role to update logs
CREATE POLICY "Service role can update AI request logs" ON ai_request_logs
  FOR UPDATE USING (true); 