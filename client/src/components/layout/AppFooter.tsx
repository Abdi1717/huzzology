/**
 * App Footer Component
 * 
 * Simple footer with links and copyright information
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/lib/routes';

export const AppFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'About', href: '/about' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Section - Logo and Description */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <Link to={ROUTES.HOME} className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-huzzology-500 to-huzzology-700 flex items-center justify-center">
                <span className="text-white font-bold text-xs">H</span>
              </div>
              <span className="font-semibold">Huzzology</span>
            </Link>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              Mapping women's pop culture archetypes
            </p>
          </div>

          {/* Center Section - Links */}
          <nav className="flex items-center gap-4">
            {footerLinks.map((link, index) => (
              <React.Fragment key={link.href}>
                <Link
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
                {index < footerLinks.length - 1 && (
                  <Separator orientation="vertical" className="h-4" />
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Right Section - Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} Huzzology. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}; 