-- Create admin user for testing
-- This ensures there's at least one admin user in the system

INSERT INTO users (id, email, first_name, last_name, role, created_at) 
VALUES (
    'admin-550e8400-e29b-41d4-a716-446655440000', 
    'admin@learnova.com', 
    'Admin', 
    'User', 
    'admin', 
    NOW()
) ON CONFLICT (email) DO UPDATE SET 
    role = 'admin',
    first_name = 'Admin',
    last_name = 'User';
