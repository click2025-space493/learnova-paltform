-- Create teacher subscriptions table
-- This table tracks teacher subscription status and publishing permissions

CREATE TABLE teacher_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'pro',
    status subscription_status NOT NULL DEFAULT 'active',
    can_publish_courses BOOLEAN NOT NULL DEFAULT false,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id)
);

-- Add indexes for better performance
CREATE INDEX idx_teacher_subscriptions_teacher_id ON teacher_subscriptions(teacher_id);
CREATE INDEX idx_teacher_subscriptions_status ON teacher_subscriptions(status);

-- Enable RLS
ALTER TABLE teacher_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teacher subscriptions
CREATE POLICY "Teachers can view their own subscription" ON teacher_subscriptions
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all teacher subscriptions" ON teacher_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage teacher subscriptions" ON teacher_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Note: updated_at trigger will be added after the function is created in the initial schema
