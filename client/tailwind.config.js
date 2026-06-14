/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      colors: {
        ink: '#171717',
        body: '#4d4d4d',
        mute: '#888888',
        hairline: '#ebebeb',
        'hairline-strong': '#a1a1a1',
        canvas: {
          DEFAULT: '#ffffff',
          soft: '#fafafa',
          'soft-2': '#f5f5f5',
        },
        link: {
          DEFAULT: '#0070f3',
          deep: '#0761d1',
          'bg-soft': '#d3e5ff',
        },
        success: '#0070f3',
        error: {
          DEFAULT: '#ee0000',
          soft: '#f7d4d6',
          deep: '#c50000',
        },
        warning: {
          DEFAULT: '#f5a623',
          soft: '#ffefcf',
          deep: '#ab570a',
        },
        violet: {
          DEFAULT: '#7928ca',
          soft: '#d8ccf1',
          deep: '#4c2889',
        },
        cyan: {
          DEFAULT: '#50e3c2',
          soft: '#aaffec',
          deep: '#29bc9b',
        },
        'highlight-pink': '#ff0080',
        'highlight-magenta': '#eb367f',
        safe: {
          high: '#0070f3',
          medium: '#f5a623',
          low: '#ee0000',
        },
        primary: {
          DEFAULT: '#171717',
          on: '#ffffff',
        },
      },
      borderRadius: {
        'card': '8px',
        'card-lg': '12px',
        'card-xl': '16px',
        'pill': '100px',
        'pill-sm': '64px',
      },
      boxShadow: {
        'card-1': '0 0 0 1px rgba(0,0,0,0.08)',
        'card-2': '0px 1px 1px rgba(0,0,0,0.02), 0px 2px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08)',
        'card-3': '0px 2px 2px rgba(0,0,0,0.04), 0px 8px 8px -8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08)',
        'card-4': '0px 2px 2px rgba(0,0,0,0.04), 0px 8px 16px -4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08)',
        'card-5': '0px 1px 1px rgba(0,0,0,0.02), 0px 8px 16px -4px rgba(0,0,0,0.04), 0px 24px 32px -8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)',
        'float': '0px 2px 2px rgba(0,0,0,0.04), 0px 8px 16px -4px rgba(0,0,0,0.04)',
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'mesh-drift': 'mesh-drift 20s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'mesh-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(2%, -1%) scale(1.01)' },
          '50%': { transform: 'translate(-1%, 2%) scale(0.99)' },
          '75%': { transform: 'translate(1%, -2%) scale(1.005)' },
        },
        'glow': {
          '0%': { opacity: '0.6' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
