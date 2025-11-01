
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
  verified: (props: LucideProps) => (
     <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="verified-grad" x1="12" y1="2" x2="12" y2="22">
          <stop stopColor="#007BFF" />
          <stop offset="1" stopColor="#0056b3" />
        </linearGradient>
        <filter id="verified-shadow" x="-20%" y="-10%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#007BFF" floodOpacity="0.5"/>
        </filter>
      </defs>
      <g filter="url(#verified-shadow)">
        {/* Back plate for 3D effect */}
        <path
            d="M21.5 12.5C21.5 17.4706 17.4706 21.5 12.5 21.5C7.52944 21.5 3.5 17.4706 3.5 12.5C3.5 7.52944 7.52944 3.5 12.5 3.5C17.4706 3.5 21.5 7.52944 21.5 12.5Z"
            fill="#004a8c"
        />
        {/* Main Badge */}
        <path
          d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
          fill="url(#verified-grad)"
        />
        {/* Checkmark */}
        <path
          d="M9 12L11.5 14.5L15 10"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  ),
};
