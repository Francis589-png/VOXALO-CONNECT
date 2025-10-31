import { type LucideProps } from 'lucide-react';

export const Icons = {
  logo: (props: LucideProps) => (
    <svg
      {...props}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-gradient-3d-top" x1="50" y1="10" x2="50" y2="60">
          <stop stopColor="hsl(var(--primary) / 0.8)" />
          <stop offset="1" stopColor="hsl(var(--primary))" />
        </linearGradient>
        <linearGradient id="logo-gradient-3d-side" x1="50" y1="15" x2="50" y2="65">
          <stop stopColor="hsl(217 91% 40%)" />
          <stop offset="1" stopColor="hsl(217 91% 30%)" />
        </linearGradient>
         <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feFlood floodColor="hsl(var(--primary) / 0.3)"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <g filter="url(#drop-shadow)">
        {/* 3D-like bottom layer */}
        <path
          d="M20 25C20 19.4772 24.4772 15 30 15H70C75.5228 15 80 19.4772 80 25V55C80 60.5228 75.5228 65 70 65H45L20 90V25Z"
          fill="url(#logo-gradient-3d-side)"
        />
        {/* Main top layer */}
        <path
          d="M20 20C20 14.4772 24.4772 10 30 10H70C75.5228 10 80 14.4772 80 20V50C80 55.5228 75.5228 60 70 60H45L20 85V20Z"
          fill="url(#logo-gradient-3d-top)"
          stroke="hsl(217 91% 70%)"
          strokeWidth="1"
        />
        
        {/* Checkmark with a slight 3D effect */}
        <path
          d="M35 34.5L50 49.5L65 34.5"
          stroke="hsl(217 91% 30% / 0.5)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
         <path
          d="M35 32.5L50 47.5L65 32.5"
          stroke="#fff"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  ),
};
