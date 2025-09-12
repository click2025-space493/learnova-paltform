-- Add student_name field to enrollment_requests table
ALTER TABLE enrollment_requests ADD COLUMN IF NOT EXISTS student_name VARCHAR(255);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_student_name ON enrollment_requests(student_name);
