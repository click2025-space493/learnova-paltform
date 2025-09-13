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
                <Link href="/courses">
                  <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" data-testid="button-explore-courses-guest">
                    Explore Courses
                  </Button>
                </Link>
              )}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
