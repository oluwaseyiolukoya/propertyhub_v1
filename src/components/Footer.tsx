import React from 'react';
import { Separator } from "./ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="px-6 py-4">
        <div className="flex items-center justify-center text-sm text-gray-600">
          <p>© {currentYear} Contrezz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


