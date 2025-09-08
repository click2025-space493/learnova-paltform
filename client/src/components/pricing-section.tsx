import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export default function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for trying out the platform",
      features: [
        "1 Course",
        "Up to 50 Students",
        "Basic Analytics",
        "Community Support",
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      popular: false,
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description: "Great for growing educators",
      features: [
        "Unlimited Courses",
        "Unlimited Students",
        "Advanced Analytics",
        "Priority Support",
        "Custom Branding",
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "default" as const,
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For institutions and large teams",
      features: [
        "Everything in Pro",
        "White Label Solution",
        "API Access",
        "Dedicated Support",
        "Custom Integrations",
      ],
      buttonText: "Contact Sales",
      buttonVariant: "secondary" as const,
      popular: false,
    },
  ];

  const includedFeatures = [
    "Secure video hosting",
    "Payment processing",
    "Student management",
    "Mobile app access",
  ];

  return (
    <section className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Simple Pricing for Teachers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your teaching goals. Students learn for free, teachers unlock powerful tools.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-6 text-center relative ${
                plan.popular ? "border-2 border-primary" : "border border-border"
              }`}
              data-testid={`pricing-card-${plan.name.toLowerCase()}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground" data-testid="badge-popular">
                    Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold text-foreground mb-2" data-testid={`plan-name-${index}`}>
                  {plan.name}
                </CardTitle>
                <div className="text-3xl font-bold text-foreground mb-4" data-testid={`plan-price-${index}`}>
                  {plan.price}
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-muted-foreground" data-testid={`plan-description-${index}`}>
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center" data-testid={`feature-${index}-${featureIndex}`}>
                      <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button
                  variant={plan.buttonVariant}
                  className="w-full"
                  data-testid={`button-${plan.name.toLowerCase()}`}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">All plans include:</p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            {includedFeatures.map((feature, index) => (
              <div key={index} className="flex items-center" data-testid={`included-feature-${index}`}>
                <Check className="h-4 w-4 text-green-600 mr-2" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
