import type { Course, Enrollment, User, CourseLesson, CourseResource } from "@shared/schema";

// Extended types for API responses that include relations
export interface CourseWithRelations extends Course {
  teacher?: User;
  lessons?: CourseLesson[];
  resources?: CourseResource[];
}

export interface EnrollmentWithCourse extends Enrollment {
  course?: Course;
}

// Dashboard stats types
export interface TeacherStats {
  totalStudents: number;
  totalCourses: number;
  monthlyRevenue: number;
  completionRate: number;
}

export interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  certificates: number;
  studyStreak: number;
}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeTeachers: number;
}