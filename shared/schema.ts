import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'student']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'trial', 'cancelled']);
export const courseStatusEnum = pgEnum('course_status', ['draft', 'published', 'archived']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'cancelled']);

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('student').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teacher subscriptions
export const teacherSubscriptions = pgTable("teacher_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  status: subscriptionStatusEnum("status").default('inactive').notNull(),
  planType: varchar("plan_type").default('free').notNull(), // free, pro, enterprise
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default('0.00'),
  coverImageUrl: varchar("cover_image_url"),
  category: varchar("category"),
  status: courseStatusEnum("status").default('draft').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course sections/lessons
export const courseLessons = pgTable("course_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: varchar("video_url"),
  orderIndex: integer("order_index").default(0),
  duration: integer("duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course resources (PDFs, images, etc.)
export const courseResources = pgTable("course_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  lessonId: varchar("lesson_id").references(() => courseLessons.id),
  title: varchar("title", { length: 255 }).notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileType: varchar("file_type"), // pdf, image, etc.
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student enrollments
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  status: enrollmentStatusEnum("status").default('active').notNull(),
  progress: integer("progress").default(0), // percentage 0-100
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Student lesson progress
export const lessonProgress = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  lessonId: varchar("lesson_id").references(() => courseLessons.id).notNull(),
  completed: boolean("completed").default(false),
  watchTime: integer("watch_time").default(0), // in seconds
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teacherSubscription: many(teacherSubscriptions),
  courses: many(courses),
  enrollments: many(enrollments),
  lessonProgress: many(lessonProgress),
}));

export const teacherSubscriptionsRelations = relations(teacherSubscriptions, ({ one }) => ({
  teacher: one(users, {
    fields: [teacherSubscriptions.teacherId],
    references: [users.id],
  }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, {
    fields: [courses.teacherId],
    references: [users.id],
  }),
  lessons: many(courseLessons),
  resources: many(courseResources),
  enrollments: many(enrollments),
}));

export const courseLessonsRelations = relations(courseLessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseLessons.courseId],
    references: [courses.id],
  }),
  resources: many(courseResources),
  progress: many(lessonProgress),
}));

export const courseResourcesRelations = relations(courseResources, ({ one }) => ({
  course: one(courses, {
    fields: [courseResources.courseId],
    references: [courses.id],
  }),
  lesson: one(courseLessons, {
    fields: [courseResources.lessonId],
    references: [courseLessons.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(users, {
    fields: [enrollments.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  student: one(users, {
    fields: [lessonProgress.studentId],
    references: [users.id],
  }),
  lesson: one(courseLessons, {
    fields: [lessonProgress.lessonId],
    references: [courseLessons.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseResourceSchema = createInsertSchema(courseResources).omit({
  id: true,
  createdAt: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
  completedAt: true,
});

export const insertTeacherSubscriptionSchema = createInsertSchema(teacherSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseLesson = typeof courseLessons.$inferSelect;
export type CourseResource = typeof courseResources.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type TeacherSubscription = typeof teacherSubscriptions.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;
export type InsertCourseResource = z.infer<typeof insertCourseResourceSchema>;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type InsertTeacherSubscription = z.infer<typeof insertTeacherSubscriptionSchema>;
