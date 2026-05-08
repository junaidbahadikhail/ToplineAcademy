import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          950: '#0f7e7e',
        },
        amber: {
          500: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
