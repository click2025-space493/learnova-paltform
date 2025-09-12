-- Fix RLS policy for enrollments to allow teachers to enroll students in their courses
-- This allows teachers to approve enrollment requests and create enrollments for students

-- Add policy for teachers to insert enrollments for their courses
CREATE POLICY "Teachers can enroll students in their courses" ON enrollments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = course_id AND c.teacher_id = auth.uid()
        )
    );
