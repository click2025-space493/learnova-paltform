-- Migration: Replace Cloudinary with YouTube video system
-- Add YouTube video ID column and remove old video URL fields

-- Add YouTube video ID column to lessons table (skip video_duration as it already exists)
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS youtube_video_id VARCHAR(20),
ADD COLUMN IF NOT EXISTS youtube_video_url TEXT;

-- Create index for faster YouTube video lookups
CREATE INDEX idx_lessons_youtube_video_id ON lessons(youtube_video_id);

-- Create video access tokens table for JWT token management
CREATE TABLE video_access_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for video access tokens
CREATE INDEX idx_video_access_tokens_lesson_user ON video_access_tokens(lesson_id, user_id);
CREATE INDEX idx_video_access_tokens_expires_at ON video_access_tokens(expires_at);
CREATE INDEX idx_video_access_tokens_token_hash ON video_access_tokens(token_hash);

-- Enable RLS on video access tokens
ALTER TABLE video_access_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for video access tokens
CREATE POLICY "Users can view their own video tokens" ON video_access_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert video tokens" ON video_access_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update video tokens" ON video_access_tokens
  FOR UPDATE USING (true);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_video_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM video_access_tokens 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired tokens (runs every hour)
-- Note: This requires pg_cron extension, alternatively can be handled by edge function
-- SELECT cron.schedule('cleanup-video-tokens', '0 * * * *', 'SELECT cleanup_expired_video_tokens();');

-- Update existing lessons to have default values
UPDATE lessons SET 
  youtube_video_id = NULL,
  youtube_video_url = NULL,
  video_duration = 0
WHERE youtube_video_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN lessons.youtube_video_id IS 'YouTube video ID extracted from YouTube URL (e.g., dQw4w9WgXcQ)';
COMMENT ON COLUMN lessons.youtube_video_url IS 'Full YouTube URL provided by teacher';
COMMENT ON COLUMN lessons.video_duration IS 'Video duration in seconds';
COMMENT ON TABLE video_access_tokens IS 'Stores JWT tokens for secure video access with expiration';
