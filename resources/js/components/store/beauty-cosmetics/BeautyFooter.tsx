import React from 'react';
import { usePage } from '@inertiajs/react';
import beautyTheme from '@/themes/beauty-cosmetics.json';
import { getImageUrl } from '@/utils/image-helper';
import { SocialIcon } from '@/utils/social-icons';

interface BeautyFooterProps {
  storeName?: string;
  logo?: string;
  content?: any;
}

export default function BeautyFooter({ storeName = 'Beauty Store', logo, content }: BeautyFooterProps) {
  const currentYear = new Date().getFullYear();
  const { props } = usePage();
  
  // Get footer content from page props, passed content, or fallback to theme JSON
  const footerContent = props.storeContent?.footer || content || beautyTheme.footer;
  
  const socialLinks = footerContent?.social_links?.value || footerContent?.social_links || [
    { platform: 'instagram', url: '' },
    { platform: 'youtube', url: '' },
    { platform: 'tiktok', url: '' },
    { platform: 'pinterest', url: '' }
  ];



  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              {logo ? (
                <img 
                  src={getImageUrl(logo)} 
                  alt={storeName} 
                  className="h-12 mb-4" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/200x80?text=${encodeURIComponent(storeName)}`;
                  }}
                />
              ) : (
                <h3 className="text-2xl font-light text-rose-400 mb-4">{storeName}</h3>
              )}
              <p className="text-gray-300 leading-relaxed">
                {footerContent?.description?.value || footerContent?.description || 'Your trusted beauty destination for premium skincare, makeup, and wellness products.'}
              </p>
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url || '#'}
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-400 hover:bg-gray-700 transition-all duration-300"
                  aria-label={social.platform}
                >
                  <SocialIcon platform={social.platform} size={24} />
                </a>
              ))}
            </div>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-rose-400">
              {footerContent?.menu1?.title?.value || footerContent?.menu1?.title || 'Customer Care'}
            </h4>
            <ul className="space-y-3">
              {(footerContent?.menu1?.links?.value || footerContent?.menu1?.links || [
                { name: 'Beauty Consultation', href: '/consultation' },
                { name: 'Shipping & Returns', href: '/shipping' },
                { name: 'Contact Us', href: '/contact' },
                { name: 'Ingredient Guide', href: '/ingredients' }
              ]).map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-gray-300 hover:text-rose-400 transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-rose-400">
              {footerContent?.menu2?.title?.value || footerContent?.menu2?.title || 'Company'}
            </h4>
            <ul className="space-y-3">
              {(footerContent?.menu2?.links?.value || footerContent?.menu2?.links || [
                { name: 'About Us', href: '/about' },
                { name: 'Careers', href: '/careers' },
                { name: 'Press', href: '/press' },
                { name: 'Privacy Policy', href: '/privacy' }
              ]).map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-gray-300 hover:text-rose-400 transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-rose-400">Get in Touch</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-rose-400 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {footerContent?.contact?.address?.value || footerContent?.contact?.address || '456 Beauty Boulevard, Wellness District, CA 90210'}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-rose-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <p className="text-gray-300 text-sm">
                  {footerContent?.contact?.phone?.value || footerContent?.contact?.phone || '+1 (555) 239-8847'}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-rose-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <p className="text-gray-300 text-sm">
                  {footerContent?.contact?.email?.value || footerContent?.contact?.email || 'hello@beautystore.com'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center">
            <p className="text-gray-400 text-sm">
              {(footerContent?.copyright_text?.value || footerContent?.copyright_text || '© {year} {store_name}. All rights reserved.')
                .replace('{year}', currentYear.toString())
                .replace('{store_name}', storeName)}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}