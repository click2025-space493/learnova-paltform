import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { GraduationCap, Menu, User, LogOut, Settings, BookOpen, Users, BarChart3 } from "lucide-react";

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
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center" data-testid="link-logo">
            <div className="text-2xl font-bold text-primary">
              <GraduationCap className="inline-block h-8 w-8 mr-2" />
              Learnova
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-primary transition-colors"
                data-testid={`link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}

            {/* User Actions */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {user?.role === 'teacher' && (
                  <Link href="/create-course">
                    <Button size="sm" variant="outline" data-testid="button-create-course">
                      Create Course
                    </Button>
                  </Link>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                        <AvatarFallback>
                          {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="text-sm font-medium" data-testid="text-user-name">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid="text-user-email">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={getUserDashboardLink()} className="w-full" data-testid="link-dashboard">
                        {user?.role === 'teacher' && <Users className="mr-2 h-4 w-4" />}
                        {user?.role === 'student' && <BookOpen className="mr-2 h-4 w-4" />}
                        {user?.role === 'admin' && <BarChart3 className="mr-2 h-4 w-4" />}
                        {getUserDashboardLabel()}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="w-full" data-testid="link-profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="w-full" data-testid="link-settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/api/logout" className="w-full" data-testid="link-logout">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <a
                  href="/api/login"
                  className="text-foreground hover:text-primary transition-colors"
                  data-testid="link-signin"
                >
                  Sign In
                </a>
                <a href="/api/login">
                  <Button data-testid="button-get-started">
                    Get Started
                  </Button>
                </a>
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
                          <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                          <AvatarFallback>
                            {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium" data-testid="mobile-text-user-name">
                            {user?.firstName} {user?.lastName}
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
                      <a
                        href="/api/login"
                        className="block text-foreground hover:text-primary transition-colors text-lg"
                        data-testid="mobile-link-signin"
                      >
                        Sign In
                      </a>
                      <a href="/api/login" className="block">
                        <Button className="w-full" data-testid="mobile-button-get-started">
                          Get Started
                        </Button>
                      </a>
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
