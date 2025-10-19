import React from 'react';
import { Separator } from "./ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <p>© {currentYear} PropertyHub. All rights reserved.</p>
            <Separator orientation="vertical" className="h-4" />
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            <Separator orientation="vertical" className="h-4" />
            <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
            <Separator orientation="vertical" className="h-4" />
            <a href="#" className="hover:text-gray-900 transition-colors">Support</a>
          </div>
          <div className="flex items-center space-x-4">
            <span>Version 1.0.0</span>
            <Separator orientation="vertical" className="h-4" />
            <a href="#" className="hover:text-gray-900 transition-colors">Documentation</a>
          </div>
        </div>
      </div>
    </footer>
  );
}


