import React from 'react';
import { Building } from 'lucide-react';

interface PublicFooterProps {
  onNavigateToHome?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToCareers?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToAPIDocumentation?: () => void;
  onNavigateToIntegrations?: () => void;
  onNavigateToHelpCenter?: () => void;
  onNavigateToCommunity?: () => void;
  onNavigateToStatus?: () => void;
  onNavigateToSecurity?: () => void;
}

export function PublicFooter({
  onNavigateToHome,
  onNavigateToAbout,
  onNavigateToCareers,
  onNavigateToBlog,
  onNavigateToContact,
  onNavigateToAPIDocumentation,
  onNavigateToIntegrations,
  onNavigateToHelpCenter,
  onNavigateToCommunity,
  onNavigateToStatus,
  onNavigateToSecurity
}: PublicFooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Building className="h-6 w-6" />
              <span className="font-bold">Contrezz</span>
            </div>
            <p className="text-gray-400">
              The complete property management SaaS platform for modern property professionals.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li>
                <button
                  onClick={onNavigateToAPIDocumentation}
                  className="hover:text-white transition-colors text-left"
                >
                  API Documentation
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateToIntegrations}
                  className="hover:text-white transition-colors text-left"
                >
                  Integrations
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button
                  onClick={onNavigateToAbout}
                  className="hover:text-white transition-colors text-left"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateToBlog}
                  className="hover:text-white transition-colors text-left"
                >
                  Blog
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateToCareers}
                  className="hover:text-white transition-colors text-left"
                >
                  Careers
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateToContact}
                  className="hover:text-white transition-colors text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button
                  onClick={onNavigateToHelpCenter}
                  className="hover:text-white transition-colors text-left"
                >
                  Help Center
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateToCommunity}
                  className="hover:text-white transition-colors text-left"
                >
                  Community
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateToStatus}
                  className="hover:text-white transition-colors text-left"
                >
                  Status
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateToSecurity}
                  className="hover:text-white transition-colors text-left"
                >
                  Security
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Contrezz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

