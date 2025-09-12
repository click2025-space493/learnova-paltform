-- Insert sample data for testing the admin dashboard
-- This migration adds sample users, teachers, and courses

-- Insert sample admin user
INSERT INTO users (id, email, name, role, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'admin@learnova.com', 'Admin User', 'admin', NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'john.teacher@learnova.com', 'John Smith', 'teacher', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'sarah.teacher@learnova.com', 'Sarah Johnson', 'teacher', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'mike.teacher@learnova.com', 'Mike Wilson', 'teacher', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'student1@learnova.com', 'Alice Brown', 'student', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'student2@learnova.com', 'Bob Davis', 'student', NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert sample courses
INSERT INTO courses (id, title, description, category, price, teacher_id, status, created_at) VALUES 
('650e8400-e29b-41d4-a716-446655440000', 'Introduction to Web Development', 'Learn the basics of HTML, CSS, and JavaScript', 'Programming', 99.99, '550e8400-e29b-41d4-a716-446655440001', 'published', NOW()),
('650e8400-e29b-41d4-a716-446655440001', 'Advanced React Patterns', 'Master advanced React concepts and patterns', 'Programming', 149.99, '550e8400-e29b-41d4-a716-446655440001', 'published', NOW()),
('650e8400-e29b-41d4-a716-446655440002', 'Digital Marketing Fundamentals', 'Complete guide to digital marketing strategies', 'Marketing', 79.99, '550e8400-e29b-41d4-a716-446655440002', 'published', NOW()),
('650e8400-e29b-41d4-a716-446655440003', 'Data Science with Python', 'Learn data analysis and machine learning', 'Data Science', 199.99, '550e8400-e29b-41d4-a716-446655440003', 'draft', NOW()),
('650e8400-e29b-41d4-a716-446655440004', 'UI/UX Design Principles', 'Master the art of user interface design', 'Design', 129.99, '550e8400-e29b-41d4-a716-446655440002', 'published', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample chapters
INSERT INTO chapters (id, course_id, title, description, position, created_at) VALUES 
('750e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', 'Getting Started', 'Introduction to web development', 1, NOW()),
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440000', 'HTML Basics', 'Learn HTML fundamentals', 2, NOW()),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'React Hooks', 'Understanding React Hooks', 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample lessons
INSERT INTO lessons (id, chapter_id, title, description, type, content, position, created_at) VALUES 
('850e8400-e29b-41d4-a716-446655440000', '750e8400-e29b-41d4-a716-446655440000', 'Welcome to Web Development', 'Course introduction', 'video', 'Welcome to the course!', 1, NOW()),
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'HTML Structure', 'Basic HTML structure', 'video', 'Learn HTML tags', 1, NOW()),
('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', 'useState Hook', 'Learn useState', 'video', 'useState examples', 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample enrollments
INSERT INTO enrollments (id, student_id, course_id, enrolled_at, progress) VALUES 
('950e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440000', NOW(), 45.5),
('950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440000', NOW(), 23.0),
('950e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', NOW(), 78.2)
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Insert sample teacher subscriptions
INSERT INTO teacher_subscriptions (id, teacher_id, plan_type, status, can_publish_courses, starts_at, created_at) VALUES 
('a50e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'pro', 'active', true, NOW(), NOW()),
('a50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'pro', 'active', true, NOW(), NOW())
ON CONFLICT (teacher_id) DO NOTHING;

-- Insert sample subscription requests
INSERT INTO teacher_subscription_requests (id, teacher_id, plan_type, message, status, created_at) VALUES 
('b50e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 'pro', 'I would like to start teaching data science courses on your platform. I have 5 years of experience in the field.', 'pending', NOW())
ON CONFLICT (id) DO NOTHING;
