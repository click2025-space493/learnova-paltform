import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCourseSchema, insertCourseLessonSchema, insertEnrollmentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Course routes
  app.get('/api/courses', async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/courses/:id', async (req, res) => {
    try {
      const course = await storage.getCourseById(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Get lessons and resources
      const lessons = await storage.getLessonsByCourse(course.id);
      const resources = await storage.getResourcesByCourse(course.id);
      
      res.json({ ...course, lessons, resources });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.get('/api/teacher/courses', isAuthenticated, async (req: any, res) => {
    try {
      const teacherId = req.user.claims.sub;
      const courses = await storage.getCoursesByTeacher(teacherId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching teacher courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post('/api/courses', isAuthenticated, async (req: any, res) => {
    try {
      const teacherId = req.user.claims.sub;
      const user = await storage.getUser(teacherId);
      
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Only teachers can create courses" });
      }

      const courseData = insertCourseSchema.parse({ ...req.body, teacherId });
      const course = await storage.createCourse(courseData);
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put('/api/courses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const teacherId = req.user.claims.sub;
      const course = await storage.getCourseById(req.params.id);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (course.teacherId !== teacherId) {
        return res.status(403).json({ message: "You can only edit your own courses" });
      }

      const updatedCourse = await storage.updateCourse(req.params.id, req.body);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.put('/api/courses/:id/publish', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const course = await storage.getCourseById(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (course.teacherId !== userId) {
        return res.status(403).json({ message: "Only the course teacher can publish this course" });
      }

      // Check if teacher has publishing permissions
      const subscription = await storage.getTeacherSubscriptionStatus(userId);
      if (!subscription?.canPublishCourses) {
        return res.status(403).json({ 
          message: "Active subscription required to publish courses",
          requiresSubscription: true
        });
      }
      
      const updatedCourse = await storage.updateCourse(id, { status: 'published' });
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error publishing course:", error);
      res.status(500).json({ message: "Failed to publish course" });
    }
  });

  // Course lesson routes
  app.get('/api/courses/:courseId/lessons', async (req, res) => {
    try {
      const lessons = await storage.getLessonsByCourse(req.params.courseId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.post('/api/courses/:courseId/lessons', isAuthenticated, async (req: any, res) => {
    try {
      const teacherId = req.user.claims.sub;
      const course = await storage.getCourseById(req.params.courseId);
      
      if (!course || course.teacherId !== teacherId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const lessonData = insertCourseLessonSchema.parse({ ...req.body, courseId: req.params.courseId });
      const lesson = await storage.createLesson(lessonData);
      res.json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lesson data", errors: error.errors });
      }
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  // Enrollment routes
  app.get('/api/student/enrollments', isAuthenticated, async (req: any, res) => {
    try {
      const studentId = req.user.claims.sub;
      const enrollments = await storage.getEnrollmentsByStudent(studentId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post('/api/courses/:courseId/enroll', isAuthenticated, async (req: any, res) => {
    try {
      const studentId = req.user.claims.sub;
      const user = await storage.getUser(studentId);
      
      if (user?.role !== 'student') {
        return res.status(403).json({ message: "Only students can enroll in courses" });
      }

      const enrollmentData = insertEnrollmentSchema.parse({
        studentId,
        courseId: req.params.courseId,
      });
      
      const enrollment = await storage.createEnrollment(enrollmentData);
      res.json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid enrollment data", errors: error.errors });
      }
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  // Stats routes
  app.get('/api/teacher/stats', isAuthenticated, async (req: any, res) => {
    try {
      const teacherId = req.user.claims.sub;
      const stats = await storage.getTeacherStats(teacherId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/student/stats', isAuthenticated, async (req: any, res) => {
    try {
      const studentId = req.user.claims.sub;
      const stats = await storage.getStudentStats(studentId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching student stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Test endpoint to check admin access
  app.get('/api/admin/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      res.json({ 
        success: true, 
        userId, 
        userRole: user?.role,
        userEmail: user?.email 
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      console.log("Admin stats request from user:", userId);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      console.log("User found:", user?.email, "Role:", user?.role);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getAdminStats();
      console.log("Stats fetched:", stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Admin: Get all teachers
  app.get('/api/admin/teachers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      console.log("Admin teachers request from user:", userId);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      console.log("User found for teachers:", user?.email, "Role:", user?.role);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const teachers = await storage.getAllTeachers();
      console.log("Teachers fetched:", teachers?.length || 0);
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Failed to fetch teachers", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Admin: Get all courses with detailed info
  app.get('/api/admin/courses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      console.log("Admin courses request from user:", userId);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      console.log("User found for courses:", user?.email, "Role:", user?.role);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const courses = await storage.getAllCoursesWithDetails();
      console.log("Courses fetched:", courses?.length || 0);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Admin: Get all videos across the platform
  app.get('/api/admin/videos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Admin: Update teacher status
  app.put('/api/admin/teachers/:teacherId/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { teacherId } = req.params;
      const { status } = req.body;
      
      const updatedTeacher = await storage.updateTeacherStatus(teacherId, status);
      res.json(updatedTeacher);
    } catch (error) {
      console.error("Error updating teacher status:", error);
      res.status(500).json({ message: "Failed to update teacher status" });
    }
  });

  // Admin: Update course status
  app.put('/api/admin/courses/:courseId/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { courseId } = req.params;
      const { status } = req.body;

      const result = await storage.updateCourseStatus(courseId, status);
      res.json(result);
    } catch (error) {
      console.error("Error updating course status:", error);
      res.status(500).json({ message: "Failed to update course status" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
