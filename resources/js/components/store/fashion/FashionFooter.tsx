import React from 'react';
import { getImageUrl } from '@/utils/image-helper';
import { SocialIcon } from '@/utils/social-icons';

interface FashionFooterProps {
  storeName?: string;
  logo?: string;
  content?: any;
}

export default function FashionFooter({ storeName = 'Fashion Store', logo, content = {} }: FashionFooterProps) {


  const socialLinks = content?.social_links || [
    { platform: 'instagram', url: '' },
    { platform: 'tiktok', url: '' },
    { platform: 'pinterest', url: '' },
    { platform: 'youtube', url: '' }
  ];

  return (
    <footer className="bg-white text-gray-900">
      {/* Main Footer */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left Side - Brand */}
            <div className="space-y-8">
              <div>
                {logo ? (
                  <img 
                    src={getImageUrl(logo)} 
                    alt={storeName} 
                    className="h-12 mb-6" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/200x80?text=${encodeURIComponent(storeName)}`;
                    }}
                  />
                ) : (
                  <h2 className="text-4xl font-thin tracking-widest uppercase mb-6">
                    {storeName}
                  </h2>
                )}
                <p className="text-gray-600 font-light text-lg leading-relaxed max-w-md">
                  {content?.description || 'Your destination for contemporary fashion and timeless style. Curating the world\'s best designers and emerging brands.'}
                </p>
              </div>
              
              {/* Social Links */}
              <div className="flex space-x-6">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url || '#'}
                    className="w-10 h-10 border border-gray-300 flex items-center justify-center hover:border-gray-500 transition-colors duration-300 group text-gray-600 hover:text-gray-900"
                    aria-label={social.platform}
                  >
                    <SocialIcon 
                      platform={social.platform} 
                      size={20}
                      className="group-hover:scale-110 transition-transform"
                    />
                  </a>
                ))}
              </div>
            </div>
            
            {/* Right Side - Contact & Links */}
            <div className="space-y-12">
              {/* Contact Information */}
              <div>
                <h3 className="text-2xl font-thin tracking-wide mb-6 uppercase">
                  Contact Us
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 font-light text-sm uppercase tracking-wide mb-2">Address</p>
                    <p className="text-gray-900 font-light leading-relaxed">
                      {content?.contact?.address || '789 Fashion Avenue, Style District, NY 10018'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-light text-sm uppercase tracking-wide mb-2">Phone</p>
                    <p className="text-gray-900 font-light">
                      {content?.contact?.phone || '+1 (555) 328-4466'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-light text-sm uppercase tracking-wide mb-2">Email</p>
                    <p className="text-gray-900 font-light">
                      {content?.contact?.email || 'hello@fashionstore.com'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Quick Links */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-light tracking-widest uppercase mb-4 text-gray-700">
                    {content?.menu1?.title || 'Customer Care'}
                  </h4>
                  <ul className="space-y-3">
                    {(content?.menu1?.links || [
                      { name: 'Size Guide', href: '/size-guide' },
                      { name: 'Shipping & Returns', href: '/shipping' },
                      { name: 'Contact Us', href: '/contact' }
                    ]).map((link, index) => (
                      <li key={index}>
                        <a href={link.href} className="text-gray-600 hover:text-gray-900 transition-colors font-light text-sm">
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-light tracking-widest uppercase mb-4 text-gray-700">
                    {content?.menu2?.title || 'Company'}
                  </h4>
                  <ul className="space-y-3">
                    {(content?.menu2?.links || [
                      { name: 'About Us', href: '/about' },
                      { name: 'Careers', href: '/careers' },
                      { name: 'Press', href: '/press' }
                    ]).map((link, index) => (
                      <li key={index}>
                        <a href={link.href} className="text-gray-600 hover:text-gray-900 transition-colors font-light text-sm">
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-500 text-sm font-light">
              {content?.copyright_text?.replace('{year}', new Date().getFullYear().toString()).replace('{store_name}', storeName) || 
               `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}