import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HeroSection() {
  const { isAuthenticated, user } = useAuth();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden cyber-gradient pt-24 pb-20 lg:pt-32 lg:pb-40">
      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none delay-700" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-float">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
              </span>
              Neural Network Online
            </div>

            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.9] text-balance">
              EVOLVE YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-glow-blue">INTELLECT</span>
              <span className="text-purple-500 text-glow-purple">.</span>
            </h1>

            <p className="text-xl text-blue-100/60 mb-12 leading-relaxed max-w-xl text-balance font-medium">
              The professional ecosystem for the pioneers of modern education. Build, scale, and monetize your expertise in the digital renaissance.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-center lg:justify-start justify-center">
              {isAuthenticated ? (
                user?.role === 'teacher' ? (
                  <Link href="/create-course">
                    <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-black font-black hover:bg-blue-400 hover:text-white transition-all shadow-2xl shadow-blue-500/20 border-none">
                      START BROADCASTING
                    </Button>
                  </Link>
                ) : (
                  <Link href="/courses">
                    <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-black font-black hover:bg-purple-500 hover:text-white transition-all shadow-2xl shadow-purple-500/20 border-none">
                      ENTER REPOSITORY
                    </Button>
                  </Link>
                )
              ) : (
                <>
                  <Link href="/role-selection">
                    <Button size="lg" className="h-16 px-10 rounded-2xl bg-blue-500 text-white font-black hover:bg-blue-400 transition-all shadow-2xl shadow-blue-500/40 border-none ring-offset-black">
                      INITIALIZE ACCESS
                    </Button>
                  </Link>
                  <Link href="/courses">
                    <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl bg-transparent text-white border-white/20 font-black hover:bg-white/5 hover:border-white transition-all">
                      SCAN CATALOG
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* New Visual element for "impressive" look */}
          <div className="flex-1 relative hidden lg:block">
            <div className="relative z-10 animate-float">
              <div className="absolute inset-0 bg-blue-500/30 blur-[80px] -z-10 rounded-full" />
              <div className="p-8 rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-3xl neon-border-blue relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-black text-sm uppercase tracking-widest">Active Core</div>
                    <div className="text-blue-400 text-xs font-bold">SYST-ID: 4930-X</div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-3/4 animate-pulse shadow-[0_0_10px_#3b82f6]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-white font-black text-lg">942</div>
                      <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Architects</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-white font-black text-lg">24.5k</div>
                      <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Scholars</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Background floating elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-float delay-1000 shadow-[0_0_50px_rgba(168,85,247,0.4)]" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl animate-float delay-500" />
          </div>
        </div>
      </div>
    </section>
  );
}
