import React from 'react';
import { Link } from '@inertiajs/react';
import { getImageUrl } from '@/utils/image-helper';
import { SocialIcon } from '@/utils/social-icons';

interface BabyKidsFooterProps {
  storeName?: string;
  logo?: string;
  content?: any;
}

export default function BabyKidsFooter({ storeName, logo, content }: BabyKidsFooterProps) {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = content?.social_links || [];



  return (
    <footer className="bg-pink-100 relative overflow-hidden">
      {/* Playful Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-pink-200 rounded-full opacity-20"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-blue-200 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 left-32 w-24 h-24 bg-yellow-200 rounded-full opacity-15"></div>
        <div className="absolute bottom-32 right-16 w-12 h-12 bg-green-200 rounded-full opacity-25"></div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                {logo ? (
                  <img src={getImageUrl(logo)} alt={storeName} className="h-12 w-auto" />
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-blue-400 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold text-gray-800">{storeName}</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                {content?.description || 'Your trusted partner in dressing your little ones with love, care, and style. Safe, comfortable, and adorable clothing for every precious moment.'}
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url || '#'}
                    target={social.url ? '_blank' : '_self'}
                    rel={social.url ? 'noopener noreferrer' : undefined}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg ${
                      index % 4 === 0 ? 'bg-pink-500 hover:bg-pink-600' :
                      index % 4 === 1 ? 'bg-blue-500 hover:bg-blue-600' :
                      index % 4 === 2 ? 'bg-purple-500 hover:bg-purple-600' :
                      'bg-red-500 hover:bg-red-600'
                    }`}
                    aria-label={social.platform}
                  >
                    <SocialIcon platform={social.platform} size={24} />
                  </a>
                ))}
              </div>
            </div>

            {/* Customer Care */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                <div className="w-6 h-6 bg-pink-400 rounded-full mr-3 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                {content?.menu1?.title || 'Customer Care'}
              </h3>
              <ul className="space-y-3">
                {(content?.menu1?.links || [
                  { name: 'Size Guide', href: '/size-guide' },
                  { name: 'Care Instructions', href: '/care-guide' },
                  { name: 'Contact Us', href: '/contact' },
                  { name: 'Safety Info', href: '/safety' }
                ]).map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-pink-500 transition-colors duration-300 flex items-center group"
                    >
                      <svg className="w-3 h-3 mr-2 text-pink-400 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                <div className="w-6 h-6 bg-blue-400 rounded-full mr-3 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                </div>
                {content?.menu2?.title || 'Company'}
              </h3>
              <ul className="space-y-3">
                {(content?.menu2?.links || [
                  { name: 'About Us', href: '/about' },
                  { name: 'Our Mission', href: '/mission' },
                  { name: 'Sustainability', href: '/sustainability' },
                  { name: 'Privacy Policy', href: '/privacy' }
                ]).map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-blue-500 transition-colors duration-300 flex items-center group"
                    >
                      <svg className="w-3 h-3 mr-2 text-blue-400 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                <div className="w-6 h-6 bg-green-400 rounded-full mr-3 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                {content?.contact_title || 'Contact Us'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-pink-400 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {content?.contact?.address || '123 Kids Avenue, Family District, NY 10019'}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <a href={`tel:${content?.contact?.phone || '+1 (555) 123-KIDS'}`} className="text-gray-600 hover:text-blue-500 transition-colors duration-300">
                    {content?.contact?.phone || '+1 (555) 123-KIDS'}
                  </a>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <a href={`mailto:${content?.contact?.email || 'hello@babykidsstore.com'}`} className="text-gray-600 hover:text-yellow-500 transition-colors duration-300">
                    {content?.contact?.email || 'hello@babykidsstore.com'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/50 py-8">
          <p className="text-center text-gray-600 text-sm">
            {content?.copyright_text?.replace('{year}', currentYear.toString()).replace('{store_name}', storeName) || 
             `© ${currentYear} ${storeName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}