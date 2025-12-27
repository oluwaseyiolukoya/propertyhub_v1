import React from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

// ContrezztLogo component (brand guideline compliant)
const ContrezztLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="4"
      y="16"
      width="12"
      height="20"
      rx="2"
      fill="currentColor"
      fillOpacity="0.9"
    />
    <rect
      x="20"
      y="8"
      width="12"
      height="28"
      rx="2"
      fill="currentColor"
      fillOpacity="1"
    />
    <rect
      x="12"
      y="4"
      width="8"
      height="14"
      rx="1.5"
      fill="currentColor"
      fillOpacity="0.7"
    />
    <circle cx="10" cy="22" r="1.5" fill="white" fillOpacity="0.6" />
    <circle cx="10" cy="28" r="1.5" fill="white" fillOpacity="0.6" />
    <circle cx="26" cy="14" r="1.5" fill="white" fillOpacity="0.6" />
    <circle cx="26" cy="20" r="1.5" fill="white" fillOpacity="0.6" />
    <circle cx="26" cy="26" r="1.5" fill="white" fillOpacity="0.6" />
  </svg>
);

interface PublicHeaderProps {
  onNavigateToHome?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToGetStarted?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToCareers?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToContact?: () => void;
  currentPage?:
    | "home"
    | "about"
    | "careers"
    | "blog"
    | "contact"
    | "schedule-demo"
    | "api-docs"
    | "integrations";
}

export function PublicHeader({
  onNavigateToHome,
  onNavigateToLogin,
  onNavigateToGetStarted,
  onNavigateToAbout,
  onNavigateToCareers,
  onNavigateToBlog,
  onNavigateToContact,
  currentPage = "home",
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
            <div className="bg-gradient-to-br from-purple-600 to-violet-600 p-1.5 rounded-lg">
              <ContrezztLogo className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Contrezz</h1>
              <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                SaaS
              </Badge>
            </div>
          </button>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              variant="ghost"
              onClick={onNavigateToHome}
              className={isActive("home") ? "bg-blue-50 text-blue-600" : ""}
            >
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={onNavigateToAbout}
              className={isActive("about") ? "bg-blue-50 text-blue-600" : ""}
            >
              About
            </Button>
            <Button
              variant="ghost"
              onClick={onNavigateToCareers}
              className={isActive("careers") ? "bg-blue-50 text-blue-600" : ""}
            >
              Careers
            </Button>
            <Button
              variant="ghost"
              onClick={onNavigateToBlog}
              className={isActive("blog") ? "bg-blue-50 text-blue-600" : ""}
            >
              Blog
            </Button>
            <Button
              variant="ghost"
              onClick={onNavigateToContact}
              className={isActive("contact") ? "bg-blue-50 text-blue-600" : ""}
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
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
