import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Users, BarChart3, CreditCard, Award, Shield } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: Video,
      title: "Video Course Creation",
      description: "Upload and organize video lessons with our secure hosting and streaming platform.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Users,
      title: "Student Management",
      description: "Track progress, manage enrollments, and communicate with students effectively.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive insights into course performance and student engagement.",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: CreditCard,
      title: "Payment Processing",
      description: "Integrated payment solutions with support for multiple payment methods.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Award,
      title: "Certificates",
      description: "Automated certificate generation for course completion and achievements.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "Role-based permissions and secure content delivery for protected learning materials.",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <section className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Teach & Learn
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful tools for educators and intuitive learning experience for students, all in one platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="bg-background border border-border card-hover" data-testid={`feature-card-${index}`}>
                <CardHeader className="pb-2">
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <IconComponent className={`${feature.color} h-6 w-6`} />
                  </div>
                  <CardTitle className="text-xl" data-testid={`feature-title-${index}`}>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground" data-testid={`feature-description-${index}`}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
