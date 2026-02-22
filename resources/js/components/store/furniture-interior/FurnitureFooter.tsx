import React from 'react';
import { getImageUrl } from '@/utils/image-helper';
import { Link } from '@inertiajs/react';
import { SocialIcon } from '@/utils/social-icons';

interface FurnitureFooterProps {
  storeName?: string;
  logo?: string;
  content?: any;
}

function FurnitureFooter({ storeName, logo, content }: FurnitureFooterProps) {
  const currentYear = new Date().getFullYear();



  return (
    <footer className="text-white" style={{ backgroundColor: 'oklch(0.3 0.06 63.96)' }}>
      <div className="container mx-auto px-6 lg:px-12">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                {logo ? (
                  <img src={getImageUrl(logo)} alt={storeName} className="h-12 w-auto" />
                ) : (
                  <h3 className="text-2xl font-light text-white">{storeName}</h3>
                )}
              </div>
              <p className="text-yellow-100 leading-relaxed mb-6">
                {content?.description || 'Your destination for premium furniture and interior design. Creating beautiful, functional spaces with carefully curated pieces and expert design services.'}
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {(content?.social_links || []).map((social, index) => (
                  <a
                    key={index}
                    href={social.url || '#'}
                    target={social.url ? '_blank' : '_self'}
                    rel={social.url ? 'noopener noreferrer' : undefined}
                    className="w-10 h-10 bg-yellow-700 rounded-full flex items-center justify-center text-yellow-200 hover:text-white hover:bg-amber-600 transition-all duration-300"
                    aria-label={social.platform}
                  >
                    <SocialIcon platform={social.platform} size={20} />
                  </a>
                ))}
              </div>
            </div>

            {/* Customer Service Menu */}
            <div>
              <h4 className="text-lg font-semibold mb-6">
                {content?.menu1?.title || 'Customer Service'}
              </h4>
              <ul className="space-y-3">
                {(content?.menu1?.links || [
                  { name: 'Design Consultation', href: '/design-consultation' },
                  { name: 'Delivery & Setup', href: '/delivery' },
                  { name: 'Care Instructions', href: '/care' },
                  { name: 'Contact Support', href: '/contact' }
                ]).map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-yellow-100 hover:text-white transition-colors duration-300 flex items-center group"
                    >
                      <span>{link.name}</span>
                      <svg className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Menu */}
            <div>
              <h4 className="text-lg font-semibold mb-6">
                {content?.menu2?.title || 'Company'}
              </h4>
              <ul className="space-y-3">
                {(content?.menu2?.links || [
                  { name: 'About Us', href: '/about' },
                  { name: 'Design Team', href: '/designers' },
                  { name: 'Showrooms', href: '/showrooms' },
                  { name: 'Privacy Policy', href: '/privacy' }
                ]).map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-yellow-100 hover:text-white transition-colors duration-300 flex items-center group"
                    >
                      <span>{link.name}</span>
                      <svg className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Contact Info</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-yellow-100 text-sm leading-relaxed">
                    {content?.contact?.address || '456 Design District, Furniture Row, NY 10019'}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <a href={`tel:${content?.contact?.phone || '+1 (555) 463-8764'}`} className="text-yellow-100 hover:text-white transition-colors duration-300">
                    {content?.contact?.phone || '+1 (555) 463-8764'}
                  </a>
                </div>
                
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <a href={`mailto:${content?.contact?.email || 'hello@furniturestore.com'}`} className="text-yellow-100 hover:text-white transition-colors duration-300">
                    {content?.contact?.email || 'hello@furniturestore.com'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-yellow-700 py-6">
          <div className="text-center">
            <p className="text-yellow-200 text-sm">
              {(content?.copyright_text || '© {year} {store_name}. All rights reserved.')
                .replace('{year}', currentYear.toString())
                .replace('{store_name}', storeName || 'Furniture Store')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FurnitureFooter;