import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Users, TrendingUp } from "lucide-react";

export default function RoleSelection() {
  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col">
      <Navigation />

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10 w-full pt-40">
        <div className="text-center mb-24">
          <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
            INITIALIZING NEURAL PATHWAY
          </Badge>
          <h1 className="text-5xl lg:text-8xl font-black text-white mb-8 tracking-tighter">
            CHOOSE YOUR <span className="text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">DESTINY.</span>
          </h1>
          <p className="text-xl text-blue-100/40 font-medium max-w-2xl mx-auto leading-relaxed">
            Select your protocol to begin your masterclass journey in the <span className="text-blue-400 uppercase tracking-widest font-black">Learnnova Nexus</span>.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Teacher Pathway */}
          <div className="group relative p-12 lg:p-16 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl transition-all duration-500 hover:bg-white/10 neon-border-purple text-left overflow-hidden">
            {/* Hover Background Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-purple-500/10 transition-all" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <GraduationCap className="h-8 w-8 text-purple-400" />
              </div>

              <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tight">EDUCATOR</h2>
              <p className="text-lg text-blue-100/40 font-medium leading-relaxed mb-12">
                Empower the next generation by sharing your masterclass expertise through high-fidelity data streams.
              </p>

              <div className="space-y-6 mb-16">
                {[
                  { icon: BookOpen, text: "Quantum Curriculum Studio", color: "purple" },
                  { icon: Users, text: "Global Neural Analytics", color: "blue" },
                  { icon: TrendingUp, text: "Protocol Monetization", color: "purple" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/40 group/item">
                    <div className={`w-8 h-8 rounded-xl bg-${item.color}-500/10 flex items-center justify-center border border-${item.color}-500/10`}>
                      <item.icon className="h-4 w-4 text-white/60" />
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>

              <Link href="/signup/teacher">
                <Button size="lg" className="w-full h-16 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-purple-500/20 hover:bg-purple-400 hover:text-white transition-all border-none" data-testid="button-teacher-signup">
                  INITIALIZE PROTOCOL →
                </Button>
              </Link>
            </div>
          </div>

          {/* Student Pathway */}
          <div className="group relative p-12 lg:p-16 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl transition-all duration-500 hover:bg-white/10 neon-border-blue text-left overflow-hidden">
            {/* Hover Background Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-blue-500/10 transition-all" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <BookOpen className="h-8 w-8 text-blue-400" />
              </div>

              <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tight">SCHOLAR</h2>
              <p className="text-lg text-blue-100/40 font-medium leading-relaxed mb-12">
                Access curated elite education and master your discipline within our global learning nexus.
              </p>

              <div className="space-y-6 mb-16">
                {[
                  { icon: BookOpen, text: "Elite Archival Access", color: "blue" },
                  { icon: TrendingUp, text: "Real-time Growth Tracking", color: "purple" },
                  { icon: GraduationCap, text: "Authorized Recognition", color: "blue" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/40 group/item">
                    <div className={`w-8 h-8 rounded-xl bg-${item.color}-500/10 flex items-center justify-center border border-${item.color}-500/10`}>
                      <item.icon className="h-4 w-4 text-white/60" />
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>

              <Link href="/signup/student">
                <Button size="lg" className="w-full h-16 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 hover:bg-blue-400 hover:text-white transition-all border-none" data-testid="button-student-signup">
                  UPLINK TO NEXUS →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-24 text-center">
          <p className="text-white/20 font-black text-[10px] uppercase tracking-widest mb-6">
            ALREADY AUTHORIZED IN THE ACADEMY?
          </p>
          <Link href="/signin">
            <Button variant="ghost" className="text-blue-400 font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-500/5 py-4 px-8 rounded-xl h-14" data-testid="button-signin">
              ACCESS PORTAL // SIGN IN
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
