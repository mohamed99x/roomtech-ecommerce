import React from 'react';
import { getImageUrl } from '@/utils/image-helper';
import { SocialIcon } from '@/utils/social-icons';

interface WatchesFooterProps {
  storeName: string;
  logo?: string;
  content?: any;
}

export default function WatchesFooter({ storeName, logo, content }: WatchesFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <div className="mb-6">
              {logo ? (
                <img src={getImageUrl(logo)} alt={storeName} className="h-12 w-auto" />
              ) : (
                <h3 className="text-2xl font-light tracking-wide">{storeName}</h3>
              )}
            </div>
            
            {/* Description */}
            <p className="text-slate-400 font-light leading-relaxed mb-8 max-w-md">
              {content?.description?.value || content?.description || 'Your premier destination for luxury timepieces. Curating the world\'s finest watches with uncompromising attention to quality and authenticity.'}
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-amber-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-400 font-light">
                  {content?.contact?.address?.value || content?.contact?.address || '456 Horological Avenue, Timepiece District, NY 10019'}
                </span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-amber-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span className="text-slate-400 font-light">
                  {content?.contact?.phone?.value || content?.contact?.phone || '+1 (555) 928-2463'}
                </span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-amber-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="text-slate-400 font-light">
                  {content?.contact?.email?.value || content?.contact?.email || 'hello@watchstore.com'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-medium mb-6 tracking-wide">
              {content?.menu1?.title?.value || content?.menu1?.title || 'Customer Service'}
            </h4>
            <ul className="space-y-3">
              {(content?.menu1?.links?.value || content?.menu1?.links || [
                { name: 'Watch Care Guide', href: '/care-guide' },
                { name: 'Warranty & Service', href: '/warranty' },
                { name: 'Contact Experts', href: '/contact' },
                { name: 'Authentication', href: '/authentication' }
              ]).map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-white font-light transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-medium mb-6 tracking-wide">
              {content?.menu2?.title?.value || content?.menu2?.title || 'Company'}
            </h4>
            <ul className="space-y-3">
              {(content?.menu2?.links?.value || content?.menu2?.links || [
                { name: 'About Us', href: '/about' },
                { name: 'Careers', href: '/careers' },
                { name: 'Press', href: '/press' },
                { name: 'Privacy Policy', href: '/privacy' }
              ]).map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-white font-light transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Copyright */}
            <p className="text-slate-400 font-light text-sm mb-4 md:mb-0">
              {(content?.copyright_text?.value || content?.copyright_text || '© {year} {store_name}. All rights reserved.')
                .replace('{year}', currentYear.toString())
                .replace('{store_name}', storeName)}
            </p>

            {/* Social Links */}
            <div className="flex space-x-6">
              {(content?.social_links?.value || content?.social_links || [
                { platform: 'instagram', url: '' },
                { platform: 'youtube', url: '' },
                { platform: 'facebook', url: '' },
                { platform: 'twitter', url: '' }
              ]).map((social, index) => (
                <a
                  key={index}
                  href={social.url || '#'}
                  className="text-slate-400 hover:text-amber-500 transition-colors duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.platform}
                >
                  <SocialIcon platform={social.platform} size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}