import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlayCircle, Clock, Star } from "lucide-react";
import type { Course } from "@shared/schema";

interface CourseCardProps {
  course: Course & {
    teacher?: {
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
    lessons?: Array<{ duration?: number }>;
    cover_image_url?: string;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const totalDuration = course.lessons?.reduce((acc, lesson) => acc + (lesson.duration || 0), 0) || 0;
  const lessonCount = course.lessons?.length || 0;

  // Determine instructor name based on course
  const getInstructorName = () => {
    if (course.title?.toLowerCase().includes("digital control") || course.title?.toLowerCase().includes("motion control")) {
      return "Eng Ahmed Samir";
    }
    if (course.title?.toLowerCase().includes("mechanical vibration")) {
      return "Eng Salah Nour";
    }
    return "Eng Mohammed Essa";
  };

  const getInstructorInitials = () => {
    if (course.title?.toLowerCase().includes("digital control") || course.title?.toLowerCase().includes("motion control")) {
      return "AS";
    }
    if (course.title?.toLowerCase().includes("mechanical vibration")) {
      return "SN";
    }
    return "ME";
  };

  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="bg-card rounded-[2rem] border border-border/50 card-premium overflow-hidden cursor-pointer group" data-testid={`course-card-${course.id}`}>
        <div className="relative aspect-[16/10] overflow-hidden">
          {(course.coverImageUrl || course.cover_image_url) ? (
            <img
              src={course.coverImageUrl || course.cover_image_url}
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              data-testid={`course-image-${course.id}`}
            />
          ) : (
            <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
              <PlayCircle className="h-12 w-12 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {course.category && (
            <div className="absolute top-4 left-4">
              <Badge className="glass text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border-white/20 text-white shadow-lg" data-testid={`course-category-${course.id}`}>
                {course.category}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs font-bold" data-testid={`course-rating-${course.id}`}>
                4.8
              </span>
            </div>
            <span className="text-lg font-extrabold text-primary tracking-tight" data-testid={`course-price-${course.id}`}>
              ${course.price || 0}
            </span>
          </div>

          <h3 className="text-xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2" data-testid={`course-title-${course.id}`}>
            {course.title}
          </h3>

          <p className="text-sm text-muted-foreground mb-6 line-clamp-2 leading-relaxed" data-testid={`course-description-${course.id}`}>
            {course.description || "Master the art of this subject with expert guidance."}
          </p>

          <div className="flex items-center justify-between pt-5 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                  <AvatarImage src={course.teacher?.profileImageUrl || ""} />
                  <AvatarFallback data-testid={`instructor-initials-${course.id}`} className="bg-primary/5 text-primary text-xs font-bold">
                    {getInstructorInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" title="Verified Expert" />
              </div>
              <span className="text-xs font-bold text-foreground/80 tracking-wide uppercase" data-testid={`instructor-name-${course.id}`}>
                {getInstructorName()}
              </span>
            </div>

            <div className="flex items-center text-muted-foreground gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span data-testid={`course-total-hours-${course.id}`} className="text-xs font-bold">
                {totalDuration > 0
                  ? `${Math.ceil(totalDuration / 60)}h`
                  : '8h+'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
