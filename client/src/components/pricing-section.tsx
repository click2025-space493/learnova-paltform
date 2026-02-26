import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export default function PricingSection() {
  const plans = [
    {
      name: "Standard",
      price: "FREE",
      description: "Entry-level neural access",
      features: [
        "1 Neural Stream",
        "50 Active Scholars",
        "Basic Data Link",
        "Community Support",
      ],
      buttonText: "INITIALIZE",
      buttonVariant: "outline" as const,
      popular: false,
      glow: "border-white/10",
    },
    {
      name: "Professional",
      price: "$29",
      period: "/MO",
      description: "Advanced cognitive scale",
      features: [
        "Unlimited Streams",
        "Infinite Scholars",
        "Predictive AI Insights",
        "Priority Support",
        "Custom Neural Sync",
      ],
      buttonText: "UPGRADE CORE",
      buttonVariant: "default" as const,
      popular: true,
      glow: "neon-border-blue bg-blue-500/5",
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/MO",
      description: "Institutional hivemind control",
      features: [
        "Full Protocol Access",
        "Decentralized Nodes",
        "Quantum Guard",
        "Dedicated Bio-Link",
        "Neural Integrations",
      ],
      buttonText: "CONTACT HQ",
      buttonVariant: "secondary" as const,
      popular: false,
      glow: "neon-border-purple bg-purple-500/5",
    },
  ];

  return (
    <section className="py-24 lg:py-40 cyber-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24">
          <Badge className="mb-6 bg-purple-500/10 text-purple-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
            Financial Protocols
          </Badge>
          <h2 className="text-4xl lg:text-7xl font-black text-white mb-8 tracking-tighter">
            SCALABLE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400">SUBSCRIPTIONS.</span>
          </h2>
          <p className="text-xl text-blue-100/40 max-w-2xl mx-auto text-balance font-medium">
            Transparent credit allocation for high-performance educational entities.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`p-10 flex flex-col items-stretch relative transition-all duration-500 rounded-[3rem] border backdrop-blur-3xl group ${plan.popular ? "scale-105 z-10" : "hover:scale-105"} ${plan.glow}`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.5)] border-none">
                    OPTIMIZED CORE
                  </Badge>
                </div>
              )}

              <div className="mb-10">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white tracking-tighter">{plan.price}</span>
                  {plan.period && (
                    <span className="text-white/40 font-bold text-sm">{plan.period}</span>
                  )}
                </div>
                <p className="mt-6 text-blue-100/40 text-sm font-medium leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="h-px bg-white/5 w-full mb-10" />
                <ul className="space-y-6 mb-12">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-4 text-sm text-white/60 font-bold">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-blue-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full h-16 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${plan.popular
                    ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-blue-400 hover:text-white"
                    : "bg-white/5 text-white border border-white/10 hover:bg-white hover:text-black"
                    }`}
                >
                  {plan.buttonText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
