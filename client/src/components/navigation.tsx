import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { GraduationCap, Menu, User, LogOut, Settings, BookOpen, Users, BarChart3, Video, UserCheck } from "lucide-react";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/courses", label: "Courses" },
    { href: "#pricing", label: "Pricing" },
    { href: "#about", label: "About" },
  ];

  const getUserDashboardLink = () => {
    switch (user?.role) {
      case 'teacher':
        return '/teacher-dashboard';
      case 'student':
        return '/student-dashboard';
      case 'admin':
        return '/admin-dashboard';
      default:
        return '/';
    }
  };

  const getUserDashboardLabel = () => {
    switch (user?.role) {
      case 'teacher':
        return 'Teacher Dashboard';
      case 'student':
        return 'Student Dashboard';
      case 'admin':
        return 'Admin Dashboard';
      default:
        return 'Dashboard';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center group transition-all duration-300" data-testid="link-logo">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:scale-105 group-hover:bg-blue-400 group-hover:text-white transition-all">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase group-hover:text-blue-400 transition-colors">
                Learnova<span className="text-blue-500">.</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-12">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:text-glow-blue transition-all"
                data-testid={`link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}

            {/* User Actions */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-6">
                {user?.role === 'teacher' && (
                  <Link href="/create-course">
                    <Button size="sm" className="bg-blue-500 hover:bg-blue-400 text-white font-black text-[10px] uppercase tracking-widest rounded-xl px-6 h-10 border-none shadow-[0_0_15px_rgba(59,130,246,0.3)]" data-testid="button-create-course">
                      New Stream
                    </Button>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-xl p-0 border border-white/10 hover:bg-white/5" data-testid="button-user-menu">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user?.avatar_url || ""} alt={user?.name || ""} />
                        <AvatarFallback className="bg-white/5 text-white text-xs font-black">
                          {user?.name?.[0] || user?.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-black/90 backdrop-blur-2xl border-white/10 p-2 rounded-2xl" align="end" forceMount>
                    <div className="flex items-center justify-start gap-3 p-3 mb-2 bg-white/5 rounded-xl">
                      <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarImage src={user?.avatar_url || ""} alt={user?.name || ""} />
                        <AvatarFallback className="bg-white/10 text-white text-xs font-black">
                          {user?.name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1 overflow-hidden">
                        <p className="text-sm font-black text-white truncate" data-testid="text-user-name">
                          {user?.name}
                        </p>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest truncate" data-testid="text-user-email">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem asChild className="focus:bg-blue-500 focus:text-white rounded-lg transition-colors p-3">
                      <Link href={getUserDashboardLink()} className="w-full flex items-center font-bold text-sm" data-testid="link-dashboard">
                        {user?.role === 'teacher' && <Users className="mr-3 h-4 w-4" />}
                        {user?.role === 'student' && <BookOpen className="mr-3 h-4 w-4" />}
                        {user?.role === 'admin' && <BarChart3 className="mr-3 h-4 w-4" />}
                        {getUserDashboardLabel()}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white rounded-lg transition-colors p-3">
                      <Link href="/profile" className="w-full flex items-center font-bold text-sm" data-testid="link-profile">
                        <User className="mr-3 h-4 w-4" />
                        Bio-Link
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white rounded-lg transition-colors p-3">
                      <Link href="/settings" className="w-full flex items-center font-bold text-sm" data-testid="link-settings">
                        <Settings className="mr-3 h-4 w-4" />
                        Config
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem asChild className="focus:bg-red-500/20 focus:text-red-400 rounded-lg transition-colors p-3">
                      <a href="/api/logout" className="w-full flex items-center font-bold text-sm text-red-400" data-testid="link-logout">
                        <LogOut className="mr-3 h-4 w-4" />
                        Disconnect
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-8">
                <Link
                  href="/signin"
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors"
                  data-testid="link-signin"
                >
                  Auth
                </Link>
                <Link href="/role-selection">
                  <Button className="bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl px-8 h-12 border-none shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-blue-400 hover:text-white transition-all" data-testid="button-get-started">
                    Initialize
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-foreground hover:text-primary transition-colors text-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid={`mobile-link-${link.label.toLowerCase()}`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {isAuthenticated ? (
                    <div className="pt-4 border-t border-border space-y-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.avatar_url || ""} alt={user?.name || ""} />
                          <AvatarFallback>
                            {user?.name?.[0] || user?.email?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium" data-testid="mobile-text-user-name">
                            {user?.name}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid="mobile-text-user-email">
                            {user?.email}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={getUserDashboardLink()}
                        className="block text-foreground hover:text-primary transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                        data-testid="mobile-link-dashboard"
                      >
                        {getUserDashboardLabel()}
                      </Link>

                      {user?.role === 'admin' && (
                        <>
                          <Link
                            href="/admin/teachers"
                            className="block text-foreground hover:text-primary transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                            data-testid="mobile-link-admin-teachers"
                          >
                            Teachers Management
                          </Link>
                          <Link
                            href="/admin/courses"
                            className="block text-foreground hover:text-primary transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                            data-testid="mobile-link-admin-courses"
                          >
                            Courses Management
                          </Link>
                          <Link
                            href="/admin/videos"
                            className="block text-foreground hover:text-primary transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                            data-testid="mobile-link-admin-videos"
                          >
                            Video Management
                          </Link>
                        </>
                      )}

                      {user?.role === 'teacher' && (
                        <Link
                          href="/create-course"
                          className="block text-foreground hover:text-primary transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                          data-testid="mobile-link-create-course"
                        >
                          Create Course
                        </Link>
                      )}

                      <a
                        href="/api/logout"
                        className="block text-foreground hover:text-primary transition-colors"
                        data-testid="mobile-link-logout"
                      >
                        Log out
                      </a>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-border space-y-4">
                      <Link
                        href="/signin"
                        className="block text-foreground hover:text-primary transition-colors text-lg"
                        onClick={() => setIsMobileMenuOpen(false)}
                        data-testid="mobile-link-signin"
                      >
                        Sign In
                      </Link>
                      <Link href="/role-selection" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full" data-testid="mobile-button-get-started">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
