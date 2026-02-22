import React from 'react';
import { getImageUrl } from '@/utils/image-helper';
import { Link } from '@inertiajs/react';
import { SocialIcon } from '@/utils/social-icons';

interface PerfumeFooterProps {
  storeName?: string;
  logo?: string;
  content?: any;
}

export default function PerfumeFooter({ storeName, logo, content }: PerfumeFooterProps) {
  const currentYear = new Date().getFullYear();



  return (
    <footer className="bg-purple-800 text-white">
      <div className="container mx-auto px-4">
        
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            
            {/* Brand Section - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-4">
                {logo ? (
                  <img src={getImageUrl(logo)} alt={storeName} className="h-12 w-auto" />
                ) : (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <span className="text-2xl font-light text-white">{storeName}</span>
                  </div>
                )}
              </div>
              
              <p className="text-purple-100 leading-relaxed max-w-md">
                {content?.description || 'Your premier destination for luxury fragrances and perfumes. Curating the world\'s finest scents from prestigious houses and emerging artisan perfumers.'}
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {(content?.social_links || []).map((social, index) => (
                  <a
                    key={index}
                    href={social.url || '#'}
                    target={social.url ? '_blank' : '_self'}
                    rel={social.url ? 'noopener noreferrer' : undefined}
                    className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-purple-200 hover:text-white hover:bg-amber-400 transition-all duration-300"
                    aria-label={social.platform}
                  >
                    <SocialIcon platform={social.platform} size={20} />
                  </a>
                ))}
              </div>
            </div>

            {/* Menu 1 */}
            <div>
              <h3 className="text-lg font-medium mb-6 text-white">
                {content?.menu1?.title || 'Fragrance Services'}
              </h3>
              <ul className="space-y-4">
                {(content?.menu1?.links || [
                  {name: 'Scent Consultation', href: '/consultation'},
                  {name: 'Fragrance Samples', href: '/samples'},
                  {name: 'Gift Services', href: '/gifts'},
                  {name: 'Fragrance Care', href: '/care-guide'}
                ]).map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-purple-200 hover:text-amber-400 transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Menu 2 */}
            <div>
              <h3 className="text-lg font-medium mb-6 text-white">
                {content?.menu2?.title || 'Company'}
              </h3>
              <ul className="space-y-4">
                {(content?.menu2?.links || [
                  {name: 'Our Story', href: '/about'},
                  {name: 'Perfumers', href: '/perfumers'},
                  {name: 'Sustainability', href: '/sustainability'},
                  {name: 'Privacy Policy', href: '/privacy'}
                ]).map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-purple-200 hover:text-amber-400 transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-medium mb-6 text-white">Contact</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-amber-400 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-purple-200 leading-relaxed">
                    {content?.contact?.address?.value || content?.contact?.address || '456 Perfume Boulevard, Scent District, NY 10019'}
                  </p>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-amber-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <a
                    href={`tel:${content?.contact?.phone?.value || content?.contact?.phone || '+1 (555) 372-3687'}`}
                    className="text-purple-200 hover:text-amber-400 transition-colors duration-300"
                  >
                    {content?.contact?.phone?.value || content?.contact?.phone || '+1 (555) 372-3687'}
                  </a>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-amber-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <a
                    href={`mailto:${content?.contact?.email?.value || content?.contact?.email || 'hello@fragrancehouse.com'}`}
                    className="text-purple-200 hover:text-amber-400 transition-colors duration-300"
                  >
                    {content?.contact?.email?.value || content?.contact?.email || 'hello@fragrancehouse.com'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-purple-700 py-8">
          <div className="text-center">
            <p className="text-purple-200">
              {content?.copyright_text?.replace('{year}', currentYear.toString()).replace('{store_name}', storeName || 'Store') || 
               `© ${currentYear} ${storeName}. All rights reserved.`}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}