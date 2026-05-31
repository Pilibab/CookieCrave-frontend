// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
// 1. Scans your entire app router directory (Dashboard, Inventory, etc.)
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    
    // 2. Scans your global components directory (Sidebar, AdminGuard, etc.)
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    
    // 3. Scans custom hooks if they dynamically output class strings
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    
    // 4. Scans the root directory files just in case
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;