import React from 'react';
import { getImageUrl } from '@/utils/image-helper';
import { SocialIcon } from '@/utils/social-icons';

interface ElectronicsFooterProps {
  storeName: string;
  logo?: string;
  content?: any;
}

export default function ElectronicsFooter({ storeName, logo, content }: ElectronicsFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Circuit Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5' stroke-opacity='0.1'%3E%3Cpath d='M10 10h40v40H10z'/%3E%3Cpath d='M20 20h20v20H20z'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              {logo ? (
                <img src={getImageUrl(logo)} alt={storeName} className="h-10 w-auto" />
              ) : (
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold">{storeName}</span>
                </div>
              )}
            </div>
            <p className="text-blue-200 mb-6 leading-relaxed">
              {content?.description?.value || content?.description || 'Your trusted destination for premium electronics and innovative gadgets with expert support and warranty.'}
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {(content?.social_links?.value || content?.social_links || [
                { platform: 'youtube', url: '' },
                { platform: 'twitter', url: '' },
                { platform: 'instagram', url: '' },
                { platform: 'linkedin', url: '' }
              ]).map((social, index) => (
                <a
                  key={index}
                  href={social.url || '#'}
                  target={social.url ? '_blank' : '_self'}
                  rel={social.url ? 'noopener noreferrer' : undefined}
                  className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center text-blue-300 hover:text-white hover:bg-blue-600 transition-all duration-300"
                  aria-label={social.platform}
                >
                  <SocialIcon platform={social.platform} size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Support Menu */}
          <div>
            <h3 className="text-lg font-semibold mb-6">
              {content?.menu1?.title?.value || content?.menu1?.title || 'Support'}
            </h3>
            <ul className="space-y-3">
              {(content?.menu1?.links?.value || content?.menu1?.links || [
                { name: 'Tech Support', href: '/support' },
                { name: 'Warranty', href: '/warranty' },
                { name: 'Returns', href: '/returns' },
                { name: 'Setup Guide', href: '/setup' }
              ]).map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-blue-200 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span>{link.name}</span>
                    <svg className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Menu */}
          <div>
            <h3 className="text-lg font-semibold mb-6">
              {content?.menu2?.title?.value || content?.menu2?.title || 'Company'}
            </h3>
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
                    className="text-blue-200 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span>{link.name}</span>
                    <svg className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <p className="text-blue-200 text-sm leading-relaxed">
                  {content?.contact?.address?.value || content?.contact?.address || '456 Tech Avenue, Innovation District, CA 94105'}
                </p>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <p className="text-blue-200 text-sm">
                  {content?.contact?.phone?.value || content?.contact?.phone || '+1 (555) 123-TECH'}
                </p>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <p className="text-blue-200 text-sm">
                  {content?.contact?.email?.value || content?.contact?.email || 'support@electronicsstore.com'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-blue-200 text-sm">
            {(content?.copyright_text?.value || content?.copyright_text || '© {year} {store_name}. All rights reserved.')
              .replace('{year}', currentYear.toString())
              .replace('{store_name}', storeName)}
          </p>
        </div>
      </div>
    </footer>
  );
}