import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import CreateCourse from "@/pages/create-course";
import TeacherDashboard from "@/pages/teacher-dashboard";
import EditCourse from "@/pages/edit-course";
import CoursePayment from "@/pages/course-payment";
import AuthCallback from "@/pages/auth-callback";
import CompleteProfile from "@/pages/complete-profile";
import UsernameSelection from "@/pages/username-selection";
import RoleSelection from "@/pages/role-selection";
import SignupTeacher from "@/pages/signup-teacher";
import SignupStudent from "@/pages/signup-student";
import Signin from "@/pages/signin";
import CourseViewer from "@/pages/course-viewer";
import StudentDashboard from "@/pages/student-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminTeachers from "@/pages/admin-teachers";
import AdminCourses from "@/pages/admin-courses";
import AdminVideos from "@/pages/admin-videos";
import CreateCourseEnhanced from "@/pages/create-course-enhanced";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - always available */}
      <Route path="/role-selection" component={RoleSelection} />
      <Route path="/signup/teacher" component={SignupTeacher} />
      <Route path="/signup/student" component={SignupStudent} />
      <Route path="/signin" component={Signin} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/courses/:id/learn" component={CourseViewer} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route path="/username-selection" component={UsernameSelection} />
      <Route path="/teacher-dashboard" component={TeacherDashboard} />
      <Route path="/student-dashboard" component={StudentDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin/teachers" component={AdminTeachers} />
      <Route path="/admin/courses" component={AdminCourses} />
      <Route path="/admin/videos" component={AdminVideos} />
      <Route path="/courses/:id/edit" component={EditCourse} />
      <Route path="/courses/:id/payment" component={CoursePayment} />
      
      {/* Conditional routes based on authentication */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/create-course" component={CreateCourseEnhanced} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
