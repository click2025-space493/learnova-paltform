-- Rollback teacher subscription system
-- This removes all subscription-related tables and data

-- Drop subscription request table
DROP TABLE IF EXISTS teacher_subscription_requests CASCADE;

-- Drop subscription request status enum
DROP TYPE IF EXISTS subscription_request_status CASCADE;

-- Drop teacher subscriptions table
DROP TABLE IF EXISTS teacher_subscriptions CASCADE;

-- Remove any sample data that was added
-- (This is safe to run even if the sample data wasn't added)
