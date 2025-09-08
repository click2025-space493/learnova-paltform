import {
  users,
  courses,
  courseLessons,
  courseResources,
  enrollments,
  teacherSubscriptions,
  lessonProgress,
  type User,
  type UpsertUser,
  type Course,
  type CourseLesson,
  type CourseResource,
  type Enrollment,
  type TeacherSubscription,
  type LessonProgress,
  type InsertCourse,
  type InsertCourseLesson,
  type InsertCourseResource,
  type InsertEnrollment,
  type InsertTeacherSubscription,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Course operations
  getCourses(): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | undefined>;
  getCoursesByTeacher(teacherId: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;

  // Course lesson operations
  getLessonsByCourse(courseId: string): Promise<CourseLesson[]>;
  createLesson(lesson: InsertCourseLesson): Promise<CourseLesson>;
  updateLesson(id: string, lesson: Partial<InsertCourseLesson>): Promise<CourseLesson>;
  deleteLesson(id: string): Promise<void>;

  // Course resource operations
  getResourcesByCourse(courseId: string): Promise<CourseResource[]>;
  createResource(resource: InsertCourseResource): Promise<CourseResource>;
  deleteResource(id: string): Promise<void>;

  // Enrollment operations
  getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: string, enrollment: Partial<InsertEnrollment>): Promise<Enrollment>;

  // Teacher subscription operations
  getTeacherSubscription(teacherId: string): Promise<TeacherSubscription | undefined>;
  createTeacherSubscription(subscription: InsertTeacherSubscription): Promise<TeacherSubscription>;
  updateTeacherSubscription(teacherId: string, subscription: Partial<InsertTeacherSubscription>): Promise<TeacherSubscription>;

  // Analytics
  getTeacherStats(teacherId: string): Promise<any>;
  getStudentStats(studentId: string): Promise<any>;
  getAdminStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.status, 'published')).orderBy(desc(courses.createdAt));
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.teacherId, teacherId)).orderBy(desc(courses.createdAt));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...course, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Course lesson operations
  async getLessonsByCourse(courseId: string): Promise<CourseLesson[]> {
    return await db.select().from(courseLessons).where(eq(courseLessons.courseId, courseId)).orderBy(courseLessons.orderIndex);
  }

  async createLesson(lesson: InsertCourseLesson): Promise<CourseLesson> {
    const [newLesson] = await db.insert(courseLessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: string, lesson: Partial<InsertCourseLesson>): Promise<CourseLesson> {
    const [updatedLesson] = await db
      .update(courseLessons)
      .set({ ...lesson, updatedAt: new Date() })
      .where(eq(courseLessons.id, id))
      .returning();
    return updatedLesson;
  }

  async deleteLesson(id: string): Promise<void> {
    await db.delete(courseLessons).where(eq(courseLessons.id, id));
  }

  // Course resource operations
  async getResourcesByCourse(courseId: string): Promise<CourseResource[]> {
    return await db.select().from(courseResources).where(eq(courseResources.courseId, courseId));
  }

  async createResource(resource: InsertCourseResource): Promise<CourseResource> {
    const [newResource] = await db.insert(courseResources).values(resource).returning();
    return newResource;
  }

  async deleteResource(id: string): Promise<void> {
    await db.delete(courseResources).where(eq(courseResources.id, id));
  }

  // Enrollment operations
  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  async getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateEnrollment(id: string, enrollment: Partial<InsertEnrollment>): Promise<Enrollment> {
    const [updatedEnrollment] = await db
      .update(enrollments)
      .set(enrollment)
      .where(eq(enrollments.id, id))
      .returning();
    return updatedEnrollment;
  }

  // Teacher subscription operations
  async getTeacherSubscription(teacherId: string): Promise<TeacherSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(teacherSubscriptions)
      .where(eq(teacherSubscriptions.teacherId, teacherId));
    return subscription;
  }

  async createTeacherSubscription(subscription: InsertTeacherSubscription): Promise<TeacherSubscription> {
    const [newSubscription] = await db.insert(teacherSubscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateTeacherSubscription(teacherId: string, subscription: Partial<InsertTeacherSubscription>): Promise<TeacherSubscription> {
    const [updatedSubscription] = await db
      .update(teacherSubscriptions)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(teacherSubscriptions.teacherId, teacherId))
      .returning();
    return updatedSubscription;
  }

  // Analytics
  async getTeacherStats(teacherId: string): Promise<any> {
    const courseCount = await db.select({ count: sql<number>`count(*)` }).from(courses).where(eq(courses.teacherId, teacherId));
    const enrollmentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(courses.teacherId, teacherId));
    
    return {
      totalCourses: courseCount[0]?.count || 0,
      totalStudents: enrollmentCount[0]?.count || 0,
      monthlyRevenue: 0, // Placeholder for payment integration
      completionRate: 94, // Placeholder
    };
  }

  async getStudentStats(studentId: string): Promise<any> {
    const enrollmentCount = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.studentId, studentId));
    const completedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.status, 'completed')));
    
    return {
      enrolledCourses: enrollmentCount[0]?.count || 0,
      completedCourses: completedCount[0]?.count || 0,
      certificates: completedCount[0]?.count || 0,
      studyStreak: 12, // Placeholder
    };
  }

  async getAdminStats(): Promise<any> {
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const courseCount = await db.select({ count: sql<number>`count(*)` }).from(courses);
    const teacherCount = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'teacher'));
    
    return {
      totalUsers: userCount[0]?.count || 0,
      totalCourses: courseCount[0]?.count || 0,
      totalRevenue: 94500, // Placeholder
      activeTeachers: teacherCount[0]?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
