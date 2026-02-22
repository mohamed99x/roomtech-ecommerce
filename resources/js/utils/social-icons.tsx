import React from 'react';
import { 
  FaFacebook, 
  FaInstagram, 
  FaTwitter, 
  FaLinkedin, 
  FaYoutube, 
  FaWhatsapp, 
  FaSnapchat, 
  FaTelegram, 
  FaDiscord, 
  FaPinterest,
  FaReddit,
  FaTumblr,
  FaVimeo,
  FaFlickr,
  FaSkype,
  FaGithub,
  FaSpotify,
  FaSoundcloud,
  FaTwitch,
  FaVk
} from 'react-icons/fa';
import { SiTiktok, SiThreads, SiMastodon, SiSignal } from 'react-icons/si';

interface SocialIconProps {
  className?: string;
  size?: number;
}

const socialIcons: { [key: string]: React.ComponentType<SocialIconProps> } = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  twitter: FaTwitter,
  linkedin: FaLinkedin,
  youtube: FaYoutube,
  whatsapp: FaWhatsapp,
  snapchat: FaSnapchat,
  telegram: FaTelegram,
  discord: FaDiscord,
  pinterest: FaPinterest,
  tiktok: SiTiktok,
  reddit: FaReddit,
  tumblr: FaTumblr,
  vimeo: FaVimeo,
  flickr: FaFlickr,
  skype: FaSkype,
  github: FaGithub,
  spotify: FaSpotify,
  soundcloud: FaSoundcloud,
  twitch: FaTwitch,
  vk: FaVk,
  threads: SiThreads,
  mastodon: SiMastodon,
  signal: SiSignal,
};

export const getSocialIcon = (platform: string) => {
  return socialIcons[platform.toLowerCase()] || null;
};

export const SocialIcon = ({ platform, className = '', size = 20 }: { platform: string; className?: string; size?: number }) => {
  const IconComponent = getSocialIcon(platform);
  if (!IconComponent) return null;
  
  return (
    <IconComponent 
      className={`transition-all duration-300 ${className}`} 
      size={size} 
    />
  );
};

export default socialIcons;