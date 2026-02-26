import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] relative overflow-hidden">
      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      <div className="relative z-10 text-center space-y-8 px-4">
        <div className="relative inline-block">
          <h1 className="text-9xl font-black text-white/5 tracking-tighter select-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase">NODE <span className="text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 italic">LOST.</span></h2>
          </div>
        </div>

        <div className="space-y-4 max-w-sm mx-auto">
          <Badge className="bg-red-500/10 text-red-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
            CONNECTION TERMINATED
          </Badge>
          <p className="text-blue-100/40 font-medium tracking-tight uppercase text-[10px] tracking-widest leading-relaxed">
            The requested data stream could not be located on the global knowledge grid. Ensure your uplink coordinates are synchronized.
          </p>
        </div>

        <div className="pt-4">
          <a href="/">
            <Button className="h-14 px-10 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-blue-400 hover:text-white transition-all border-none">
              REBOOT TO HOME
            </Button>
          </a>
        </div>
      </div>

      {/* Decorative Glitch Lines */}
      <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent opacity-50" />
      <div className="absolute bottom-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-50" />
    </div>
  );
}
