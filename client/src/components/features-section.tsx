import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Added Badge import
import { Video, Users, BarChart3, CreditCard, Award, Shield, BookOpen } from "lucide-react"; // Added BookOpen

export default function FeaturesSection() {
  const features = [
    {
      icon: Video,
      title: "Holographic Streaming",
      description: "High-definition, low-latency video neural-casting for immersive learning.",
      color: "text-blue-400",
      glow: "neon-border-blue",
    },
    {
      icon: Users,
      title: "Hivemind Sync",
      description: "Neural-link student management with real-time biometric engagement tracking.",
      color: "text-purple-400",
      glow: "neon-border-purple",
    },
    {
      icon: BarChart3,
      title: "Quantum Analytics",
      description: "Predictive AI dashboards analyzing student performance across dimensions.",
      color: "text-cyan-400",
      glow: "neon-border-blue",
    },
    {
      icon: CreditCard,
      title: "Crypto Ledger",
      description: "Instant decentralized payments with global multi-currency clearing.",
      color: "text-blue-400",
      glow: "neon-border-blue",
    },
    {
      icon: Award,
      title: "NFT Credentials",
      description: "Immutable on-chain certification for secure peer-validated achievements.",
      color: "text-purple-400",
      glow: "neon-border-purple",
    },
    {
      icon: Shield,
      title: "Neural Shield",
      description: "Military-grade encryption for protected intellectual property assets.",
      color: "text-cyan-400",
      glow: "neon-border-blue",
    },
  ];

  return (
    <section className="py-24 lg:py-32 cyber-gradient border-y border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24">
          <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
            Core Modules
          </Badge>
          <h2 className="text-4xl lg:text-7xl font-black text-white mb-8 tracking-tighter">
            QUANTUM <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">INFRASTRUCTURE.</span>
          </h2>
          <p className="text-xl text-blue-100/40 max-w-2xl mx-auto text-balance font-medium">
            Next-gen educational protocols engineered for the creators of tomorrow's reality.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className={`group relative p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden cursor-default transition-all duration-500 hover:bg-white/10 ${feature.glow}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700" />

                <div className="relative z-10">
                  <div className={`w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 border border-white/10`}>
                    <IconComponent className={`${feature.color} h-8 w-8`} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-6 tracking-tight group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-blue-100/40 font-medium leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
