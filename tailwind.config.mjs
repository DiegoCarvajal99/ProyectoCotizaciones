/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#050505',
          blue: '#00A3E0',
          cyan: '#00E5FF',
          magenta: '#FF00FF',
          yellow: '#FDE047',
          gray: '#1A1A1A',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 5px #00A3E0, 0 0 20px rgba(0, 163, 224, 0.3)',
        'neon-cyan': '0 0 5px #00E5FF, 0 0 20px rgba(0, 229, 255, 0.3)',
        'neon-magenta': '0 0 5px #FF00FF, 0 0 20px rgba(255, 0, 255, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 10s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        glow: {
          'from': { textShadow: '0 0 5px #00A3E0, 0 0 10px #00A3E0' },
          'to': { textShadow: '0 0 10px #00E5FF, 0 0 20px #00E5FF' },
        },
      },
    },
  },
  plugins: [],
};
