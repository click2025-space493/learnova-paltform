import { Link } from "wouter";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const productLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#api", label: "API Docs" },
    { href: "#integrations", label: "Integrations" },
  ];

  const supportLinks = [
    { href: "#help", label: "Help Center" },
    { href: "#contact", label: "Contact Us" },
    { href: "#community", label: "Community" },
    { href: "#status", label: "Status" },
  ];

  const companyLinks = [
    { href: "#about", label: "About" },
    { href: "#blog", label: "Blog" },
    { href: "#careers", label: "Careers" },
    { href: "#press", label: "Press" },
  ];

  const socialLinks = [
    { href: "#", icon: "twitter", label: "Twitter" },
    { href: "https://www.facebook.com/share/g/1AmnUqVKsP/", icon: "facebook", label: "Facebook" },
    { href: "https://www.linkedin.com/in/mohamed-essa-b77425284/", icon: "linkedin", label: "LinkedIn" },
  ];

  return (
    <footer className="cyber-gradient border-t border-white/5 py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 lg:gap-8">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="group flex items-center gap-3 mb-10" data-testid="footer-logo">
              <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:rotate-6 group-hover:bg-blue-400 group-hover:text-white transition-all">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase">
                Learnova<span className="text-blue-500">.</span>
              </span>
            </Link>
            <p className="text-lg text-blue-100/40 font-medium mb-10 max-w-sm leading-relaxed" data-testid="footer-description">
              The world's first decentralized neural-learning infrastructure. Building the future of mental evolution through quantum technology.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-blue-400/50 hover:bg-blue-400/5 transition-all group/icon"
                  aria-label={social.label}
                  data-testid={`social-${social.icon}`}
                >
                  <span className="text-xs font-black uppercase tracking-widest group-hover/icon:text-glow-blue">{social.icon === "linkedin" ? "in" : social.icon[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-10" data-testid="footer-product-title">
              Protocol
            </h3>
            <ul className="space-y-4">
              {productLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-white/60 font-bold hover:text-blue-400 transition-colors inline-block text-sm"
                    data-testid={`product-link-${index}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-10" data-testid="footer-support-title">
              Terminal
            </h3>
            <ul className="space-y-4">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-white/60 font-bold hover:text-blue-400 transition-colors inline-block text-sm"
                    data-testid={`support-link-${index}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-10" data-testid="footer-company-title">
              Entity
            </h3>
            <ul className="space-y-4">
              {companyLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-white/60 font-bold hover:text-blue-400 transition-colors inline-block text-sm"
                    data-testid={`company-link-${index}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 mt-24 pt-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-xs font-black text-white/20 uppercase tracking-widest" data-testid="footer-copyright">
            © 2025 Learnova Studio // Neural Network v1.0.4
          </p>
          <div className="flex gap-10">
            <a href="#" className="text-[10px] font-black text-white/20 hover:text-blue-400 uppercase tracking-[0.2em] transition-colors">Privacy.LOG</a>
            <a href="#" className="text-[10px] font-black text-white/20 hover:text-blue-400 uppercase tracking-[0.2em] transition-colors">Terms.LOG</a>
            <a href="#" className="text-[10px] font-black text-white/20 hover:text-blue-400 uppercase tracking-[0.2em] transition-colors">Hash.8723</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
