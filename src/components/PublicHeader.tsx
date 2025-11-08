import React from 'react';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Building } from 'lucide-react';

interface PublicHeaderProps {
  onNavigateToHome?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToGetStarted?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToCareers?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToContact?: () => void;
  currentPage?: 'home' | 'about' | 'careers' | 'blog' | 'contact' | 'schedule-demo' | 'api-docs' | 'integrations';
}

export function PublicHeader({
  onNavigateToHome,
  onNavigateToLogin,
  onNavigateToGetStarted,
  onNavigateToAbout,
  onNavigateToCareers,
  onNavigateToBlog,
  onNavigateToContact,
  currentPage = 'home'
}: PublicHeaderProps) {

  const isActive = (page: string) => currentPage === page;

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={onNavigateToHome}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <Building className="h-8 w-8 text-blue-600" />
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Contrezz</h1>
              <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">SaaS</Badge>
            </div>
          </button>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              variant="ghost"
              onClick={onNavigateToHome}
              className={isActive('home') ? 'bg-blue-50 text-blue-600' : ''}
            >
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={onNavigateToAbout}
              className={isActive('about') ? 'bg-blue-50 text-blue-600' : ''}
            >
              About
            </Button>
            <Button
              variant="ghost"
              onClick={onNavigateToCareers}
              className={isActive('careers') ? 'bg-blue-50 text-blue-600' : ''}
            >
              Careers
            </Button>
            <Button
              variant="ghost"
              onClick={onNavigateToBlog}
              className={isActive('blog') ? 'bg-blue-50 text-blue-600' : ''}
            >
              Blog
            </Button>
            <Button
              variant="ghost"
              onClick={onNavigateToContact}
              className={isActive('contact') ? 'bg-blue-50 text-blue-600' : ''}
            >
              Contact
            </Button>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={onNavigateToLogin}
              className="hidden sm:inline-flex"
            >
              Sign In
            </Button>
            <Button
              onClick={onNavigateToGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

