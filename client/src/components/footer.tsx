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
    <footer className="bg-card border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center mb-4" data-testid="footer-logo">
              <div className="text-2xl font-bold text-primary">
                <GraduationCap className="inline-block h-8 w-8 mr-2" />
                Learnova
              </div>
            </Link>
            <p className="text-muted-foreground text-sm mb-4" data-testid="footer-description">
              Empowering educators and students with innovative learning technology.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-muted-foreground hover:text-primary"
                  data-testid={`social-${social.icon}`}
                >
                  <a href={social.href} aria-label={social.label}>
                    <span className="sr-only">{social.label}</span>
                    {/* Using text instead of icons for simplicity */}
                    {social.icon === "twitter" && "𝕏"}
                    {social.icon === "facebook" && "f"}
                    {social.icon === "linkedin" && "in"}
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-4" data-testid="footer-product-title">
              Product
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {productLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="hover:text-primary transition-colors"
                    data-testid={`product-link-${index}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4" data-testid="footer-support-title">
              Support
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="hover:text-primary transition-colors"
                    data-testid={`support-link-${index}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4" data-testid="footer-company-title">
              Company
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {companyLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="hover:text-primary transition-colors"
                    data-testid={`company-link-${index}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground" data-testid="footer-copyright">
            © 2024 Learnova. All rights reserved. Built with ❤️ for educators worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
