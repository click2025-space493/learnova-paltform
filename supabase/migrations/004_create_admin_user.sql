-- Create admin user migration
-- Replace with your actual email and details

-- Insert admin user (if not exists)
INSERT INTO users (email, name, role, created_at, updated_at)
VALUES ('admin@learnova.com', 'Admin User', 'admin', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Alternative: Update existing user to admin
-- UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
