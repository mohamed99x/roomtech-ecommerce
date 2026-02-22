import React from 'react';
import { getImageUrl } from '@/utils/image-helper';
import { SocialIcon } from '@/utils/social-icons';

interface JewelryFooterProps {
  storeName?: string;
  logo?: string;
  content?: any;
}

export default function JewelryFooter({ storeName = 'Luxury Jewelry', logo, content = {} }: JewelryFooterProps) {
  const footerContent = content || {};
  const description = footerContent.description || 'Fine jewelry and luxury goods since our founding.';
  const socialLinks = footerContent.social_links || [];

  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="container mx-auto px-4 py-16">
        {/* Single Row Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0">
          {/* Brand */}
          <div className="text-center lg:text-left">
            {logo ? (
              <img 
                src={getImageUrl(logo)} 
                alt={storeName} 
                className="h-12 mb-2" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/200x80?text=${encodeURIComponent(storeName)}`;
                }}
              />
            ) : (
              <h2 className="text-2xl font-serif text-neutral-900 mb-2">
                {storeName}
              </h2>
            )}
            <p className="text-neutral-600 text-sm max-w-xs">
              {description}
            </p>
          </div>
          
          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-8">
            {(footerContent.menu?.links || [
              { name: 'Jewelry Care', href: '/jewelry-care' },
              { name: 'Sizing Guide', href: '/sizing' },
              { name: 'Heritage', href: '/heritage' },
              { name: 'Contact', href: '/contact' }
            ]).map((link, index) => (
              <a key={index} href={link.href} className="text-neutral-600 hover:text-yellow-700 transition-colors text-sm font-medium">
                {link.name}
              </a>
            ))}
          </div>
          
          {/* Social Links */}
          <div className="flex space-x-4">
            {Array.isArray(socialLinks) ? socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url || '#'}
                target={social.url ? '_blank' : '_self'}
                rel={social.url ? 'noopener noreferrer' : undefined}
                className="w-10 h-10 bg-neutral-100 hover:bg-yellow-700 hover:text-white flex items-center justify-center transition-colors duration-300"
                aria-label={social.platform}
              >
                <SocialIcon platform={social.platform} size={16} />
              </a>
            )) : null}
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-neutral-200 mt-12 pt-8 text-center">
          <p className="text-neutral-500 text-sm">
            {footerContent?.copyright_text?.replace('{year}', new Date().getFullYear().toString()).replace('{store_name}', storeName) || 
             `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}