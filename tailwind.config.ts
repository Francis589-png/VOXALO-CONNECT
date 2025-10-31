import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'sm-3d': '1px 1px 2px #bebebe, -1px -1px 2px #ffffff',
        'md-3d': '3px 3px 6px #bebebe, -3px -3px 6px #ffffff',
        'lg-3d': '8px 8px 16px #bebebe, -8px -8px 16px #ffffff',
        'inset-3d': 'inset 2px 2px 5px #bebebe, inset -2px -2px 5px #ffffff',
        'dark-sm-3d': '1px 1px 2px #1c1c1c, -1px -1px 2px #2a2a2a',
        'dark-md-3d': '3px 3px 6px #1c1c1c, -3px -3px 6px #2a2a2a',
        'dark-lg-3d': '8px 8px 16px #1c1c1c, -8px -8px 16px #2a2a2a',
        'dark-inset-3d': 'inset 2px 2px 5px #1c1c1c, inset -2px -2px 5px #2a2a2a',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addUtilities, theme, e }: any) {
      const lightShadows = theme('boxShadow');
      const darkShadows = {
        'sm-3d': '1px 1px 2px #19202a, -1px -1px 2px #27303e',
        'md-3d': '3px 3px 6px #19202a, -3px -3px 6px #27303e',
        'lg-3d': '8px 8px 16px #19202a, -8px -8px 16px #27303e',
        'inset-3d': 'inset 2px 2px 5px #19202a, inset -2px -2px 5px #27303e',
      };
      
      const lightUtilities = Object.fromEntries(
        Object.entries(lightShadows).filter(([key]) => key.includes('-3d')).map(([key, value]) => [
          `.${e(`shadow-${key}`)}`,
          { 'box-shadow': value },
        ])
      );

      const darkUtilities = Object.fromEntries(
        Object.entries(darkShadows).map(([key, value]) => [
          `.dark .${e(`shadow-${key}`)}`,
          { 'box-shadow': value },
        ])
      );

      addUtilities({ ...lightUtilities, ...darkUtilities });
    },
  ],
} satisfies Config;
