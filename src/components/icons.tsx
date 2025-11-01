
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
  jttLogo: (props: LucideProps) => (
    <svg
      {...props}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="jtt-grad" x1="0" y1="0" x2="0" y2="60">
          <stop stopColor="hsl(var(--primary))" offset="0%" />
          <stop stopColor="hsl(var(--primary) / 0.8)" offset="100%" />
        </linearGradient>
        <filter id="jtt-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="hsl(var(--primary) / 0.3)" />
        </filter>
      </defs>
      <g filter="url(#jtt-shadow)">
        <text fill="url(#jtt-grad)" fontFamily="sans-serif" fontSize="50" fontWeight="bold" letterSpacing="2">
          <tspan x="20" y="45">JTT</tspan>
        </text>
      </g>
    </svg>
  ),
  checkers: (props: LucideProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
        <path d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 12 2.5Zm0 17a7.5 7.5 0 1 1 7.5-7.5A7.5 7.5 0 0 1 12 19.5Z"/>
        <path d="M12 5.5a6.5 6.5 0 1 0 6.5 6.5A6.51 6.51 0 0 0 12 5.5Zm0 11a4.5 4.5 0 1 1 4.5-4.5A4.5 4.5 0 0 1 12 16.5Z"/>
    </svg>
  ),
};
