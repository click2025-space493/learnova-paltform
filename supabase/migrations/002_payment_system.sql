-- Add payment methods to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instapay_number VARCHAR(20);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS vodafone_cash_number VARCHAR(20);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- Create enrollment_requests table for pending enrollments
CREATE TABLE IF NOT EXISTS enrollment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('instapay', 'vodafone_cash')),
  payment_reference VARCHAR(100),
  payment_screenshot_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id),
  notes TEXT,
  UNIQUE(student_id, course_id)
);

-- Enable RLS on enrollment_requests
ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrollment_requests
CREATE POLICY "Students can view their own enrollment requests" ON enrollment_requests
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create enrollment requests" ON enrollment_requests
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their pending requests" ON enrollment_requests
  FOR UPDATE USING (student_id = auth.uid() AND status = 'pending');

CREATE POLICY "Teachers can view requests for their courses" ON enrollment_requests
  FOR SELECT USING (
    course_id IN (
      SELECT id FROM courses WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update requests for their courses" ON enrollment_requests
  FOR UPDATE USING (
    course_id IN (
      SELECT id FROM courses WHERE teacher_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_student_id ON enrollment_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_course_id ON enrollment_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_status ON enrollment_requests(status);
