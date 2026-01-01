
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 40, glow = true }) => {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background Glow */}
      {glow && (
        <div className="absolute inset-0 bg-burgundy-900/40 blur-2xl rounded-full animate-pulse-slow" />
      )}
      
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full"
      >
        <defs>
          <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#fef3c7" />
          </linearGradient>
        </defs>
        
        {/* Abstract Elegant Shape (Double Petal/Infinity) */}
        <path 
          d="M50 20 C65 20 80 35 80 50 C80 65 65 80 50 80 C35 80 20 65 20 50 C20 35 35 20 50 20Z" 
          stroke="url(#gold-grad)" 
          strokeWidth="1.5"
          className="opacity-40"
        />
        
        <path 
          d="M30 40 C30 20 70 20 70 40 C70 60 50 85 50 85 C50 85 30 60 30 40Z" 
          fill="none"
          stroke="url(#gold-grad)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path 
          d="M40 45 L50 35 L60 45" 
          stroke="white" 
          strokeWidth="2"
          strokeLinecap="round"
          className="opacity-60"
        />
        
        {/* Central Spark */}
        <circle cx="50" cy="42" r="2.5" fill="white" className="animate-pulse" />
      </svg>
    </div>
  );
};

export default Logo;
