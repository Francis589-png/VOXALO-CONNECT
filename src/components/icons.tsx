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
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(217 91% 60%)" />
        </linearGradient>
      </defs>
      <path
        d="M20 20C20 14.4772 24.4772 10 30 10H70C75.5228 10 80 14.4772 80 20V50C80 55.5228 75.5228 60 70 60H45L20 85V20Z"
        stroke="url(#logo-gradient)"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <path
        d="M35 32.5L50 47.5L65 32.5"
        stroke="url(#logo-gradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};
