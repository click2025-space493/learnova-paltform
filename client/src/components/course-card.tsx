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
    if (course.title === "Digital Control" || course.title === "Motion Control") {
      return "Eng Ahmed Samir";
    }
    return "Eng Mohammed Essa";
  };
  
  const getInstructorInitials = () => {
    if (course.title === "Digital Control" || course.title === "Motion Control") {
      return "AS";
    }
    return "ME";
  };

  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="bg-card rounded-xl shadow-sm border border-border card-hover overflow-hidden cursor-pointer" data-testid={`course-card-${course.id}`}>
        {(course.coverImageUrl || course.cover_image_url) ? (
          <img
            src={course.coverImageUrl || course.cover_image_url}
            alt={course.title}
            className="w-full h-40 sm:h-48 object-cover"
            data-testid={`course-image-${course.id}`}
          />
        ) : (
          <div className="w-full h-40 sm:h-48 bg-muted flex items-center justify-center">
            <PlayCircle className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
          </div>
        )}
        
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            {course.category && (
              <Badge variant="secondary" data-testid={`course-category-${course.id}`}>
                {course.category}
              </Badge>
            )}
            <div className="flex items-center text-yellow-500">
              <Star className="h-4 w-4 mr-1" />
              <span className="text-sm" data-testid={`course-rating-${course.id}`}>
                4.8
              </span>
            </div>
          </div>
          
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 line-clamp-2" data-testid={`course-title-${course.id}`}>
            {course.title}
          </h3>
          
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3" data-testid={`course-description-${course.id}`}>
            {course.description || "No description available"}
          </p>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex items-center">
              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mr-2">
                <AvatarImage src={course.teacher?.profileImageUrl || ""} />
                <AvatarFallback data-testid={`instructor-initials-${course.id}`} className="text-xs">
                  {getInstructorInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs sm:text-sm text-muted-foreground truncate" data-testid={`instructor-name-${course.id}`}>
                {getInstructorName()}
              </span>
            </div>
            <span className="text-base sm:text-lg font-bold text-primary" data-testid={`course-price-${course.id}`}>
              ${course.price || 0}
            </span>
          </div>
          
          <div className="pt-3 sm:pt-4 border-t border-border">
            <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                <span data-testid={`course-total-hours-${course.id}`} className="font-medium">
                  {totalDuration > 0 
                    ? `${Math.ceil(totalDuration / 60)} Total Watching Hours`
                    : 'Course Duration TBA'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
