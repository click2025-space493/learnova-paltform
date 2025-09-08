import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function HeroSection() {
  const { isAuthenticated, user } = useAuth();

  return (
    <section className="hero-gradient py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Transform Learning with{" "}
              <span className="text-accent">Learnova</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              The ultimate SaaS platform for educators and students. Create, share, and learn with cutting-edge tools and seamless collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {isAuthenticated ? (
                user?.role === 'teacher' ? (
                  <Link href="/create-course">
                    <Button size="lg" className="bg-accent text-accent-foreground hover:opacity-90" data-testid="button-create-course">
                      Create Course
                    </Button>
                  </Link>
                ) : (
                  <Link href="/courses">
                    <Button size="lg" className="bg-accent text-accent-foreground hover:opacity-90" data-testid="button-explore-courses">
                      Explore Courses
                    </Button>
                  </Link>
                )
              ) : (
                <>
                  <a href="/api/login">
                    <Button size="lg" className="bg-accent text-accent-foreground hover:opacity-90" data-testid="button-start-teaching">
                      Start Teaching
                    </Button>
                  </a>
                  <Link href="/courses">
                    <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" data-testid="button-explore-courses-guest">
                      Explore Courses
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-white" data-testid="text-teachers-stat">
                  10K+
                </div>
                <div className="text-white/80">Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-white" data-testid="text-students-stat">
                  50K+
                </div>
                <div className="text-white/80">Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-white" data-testid="text-courses-stat">
                  2K+
                </div>
                <div className="text-white/80">Courses</div>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Modern learning illustration with geometric shapes */}
            <div className="relative bg-white/10 rounded-3xl p-8 backdrop-blur-sm border border-white/20">
              {/* Mockup of dashboard interface */}
              <Card className="shadow-2xl overflow-hidden">
                <div className="bg-primary text-primary-foreground p-4">
                  <h3 className="font-semibold" data-testid="text-dashboard-title">
                    Teacher Dashboard
                  </h3>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Course Progress</span>
                    <span className="text-sm font-semibold" data-testid="text-progress-percentage">
                      74%
                    </span>
                  </div>
                  <Progress value={74} className="progress-bar" />
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-primary" data-testid="text-demo-students">
                        156
                      </div>
                      <div className="text-xs text-muted-foreground">Students</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-secondary" data-testid="text-demo-revenue">
                        $2,340
                      </div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
