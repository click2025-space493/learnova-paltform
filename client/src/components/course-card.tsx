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
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const totalDuration = course.lessons?.reduce((acc, lesson) => acc + (lesson.duration || 0), 0) || 0;
  const lessonCount = course.lessons?.length || 0;

  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="bg-card rounded-xl shadow-sm border border-border card-hover overflow-hidden cursor-pointer" data-testid={`course-card-${course.id}`}>
        {course.coverImageUrl ? (
          <img
            src={course.coverImageUrl}
            alt={course.title}
            className="w-full h-48 object-cover"
            data-testid={`course-image-${course.id}`}
          />
        ) : (
          <div className="w-full h-48 bg-muted flex items-center justify-center">
            <PlayCircle className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <CardContent className="p-6">
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
          
          <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`course-title-${course.id}`}>
            {course.title}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3" data-testid={`course-description-${course.id}`}>
            {course.description || "No description available"}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={course.teacher?.profileImageUrl || ""} />
                <AvatarFallback data-testid={`instructor-initials-${course.id}`}>
                  {course.teacher?.firstName?.[0] || 'T'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground" data-testid={`instructor-name-${course.id}`}>
                {course.teacher?.firstName && course.teacher?.lastName
                  ? `${course.teacher.firstName} ${course.teacher.lastName}`
                  : "Unknown Instructor"}
              </span>
            </div>
            <span className="text-lg font-bold text-primary" data-testid={`course-price-${course.id}`}>
              ${course.price || 0}
            </span>
          </div>
          
          <div className="pt-4 border-t border-border">
            <div className="flex items-center text-sm text-muted-foreground">
              <PlayCircle className="h-4 w-4 mr-2" />
              <span data-testid={`course-lessons-${course.id}`}>
                {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
              </span>
              <Clock className="h-4 w-4 ml-4 mr-2" />
              <span data-testid={`course-duration-${course.id}`}>
                {Math.ceil(totalDuration / 60)} hour{Math.ceil(totalDuration / 60) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
