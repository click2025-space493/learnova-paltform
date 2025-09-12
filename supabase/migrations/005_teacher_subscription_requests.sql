-- Teacher subscription request system
-- This allows teachers to request subscription approval from admins

-- Create subscription request status enum
CREATE TYPE subscription_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create teacher subscription requests table
CREATE TABLE teacher_subscription_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'pro',
    message TEXT, -- Teacher's request message explaining why they need subscription
    status subscription_request_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT, -- Admin's notes/response when reviewing
    reviewed_by UUID REFERENCES users(id), -- Which admin reviewed this request
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_subscription_requests_teacher_id ON teacher_subscription_requests(teacher_id);
CREATE INDEX idx_subscription_requests_status ON teacher_subscription_requests(status);
CREATE INDEX idx_subscription_requests_created_at ON teacher_subscription_requests(created_at);

-- Add RLS policies for security
ALTER TABLE teacher_subscription_requests ENABLE ROW LEVEL SECURITY;

-- Teachers can only see their own requests
CREATE POLICY "Teachers can view own subscription requests" ON teacher_subscription_requests
    FOR SELECT USING (auth.uid() = teacher_id);

-- Teachers can create their own requests
CREATE POLICY "Teachers can create subscription requests" ON teacher_subscription_requests
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their own pending requests
CREATE POLICY "Teachers can update own pending requests" ON teacher_subscription_requests
    FOR UPDATE USING (auth.uid() = teacher_id AND status = 'pending');

-- Admins can view all requests
CREATE POLICY "Admins can view all subscription requests" ON teacher_subscription_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- The teacher_subscriptions table is created in migration 004_teacher_subscriptions.sql
-- This migration focuses on the subscription requests system
