import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "overlay-show": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "overlay-hide": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "sheet-in-from-right": {
          from: { opacity: "0", transform: "translate3d(32px, 0, 0) scale(0.985)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" },
        },
        "sheet-out-to-right": {
          from: { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" },
          to: { opacity: "0", transform: "translate3d(32px, 0, 0) scale(0.985)" },
        },
        "sheet-in-from-left": {
          from: { opacity: "0", transform: "translate3d(-32px, 0, 0) scale(0.985)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" },
        },
        "sheet-out-to-left": {
          from: { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" },
          to: { opacity: "0", transform: "translate3d(-32px, 0, 0) scale(0.985)" },
        },
        "sheet-in-from-top": {
          from: { opacity: "0", transform: "translate3d(0, -24px, 0) scale(0.99)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" },
        },
        "sheet-out-to-top": {
          from: { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" },
          to: { opacity: "0", transform: "translate3d(0, -24px, 0) scale(0.99)" },
        },
        "sheet-in-from-bottom": {
          from: { opacity: "0", transform: "translate3d(0, 28px, 0) scale(0.99)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" },
        },
        "sheet-out-to-bottom": {
          from: { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" },
          to: { opacity: "0", transform: "translate3d(0, 28px, 0) scale(0.99)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "overlay-show": "overlay-show 320ms cubic-bezier(0.16, 1, 0.3, 1)",
        "overlay-hide": "overlay-hide 240ms cubic-bezier(0.4, 0, 1, 1)",
        "sheet-in-from-right":
          "sheet-in-from-right 360ms cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-out-to-right":
          "sheet-out-to-right 260ms cubic-bezier(0.4, 0, 1, 1)",
        "sheet-in-from-left":
          "sheet-in-from-left 360ms cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-out-to-left":
          "sheet-out-to-left 260ms cubic-bezier(0.4, 0, 1, 1)",
        "sheet-in-from-top":
          "sheet-in-from-top 320ms cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-out-to-top":
          "sheet-out-to-top 240ms cubic-bezier(0.4, 0, 1, 1)",
        "sheet-in-from-bottom":
          "sheet-in-from-bottom 360ms cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-out-to-bottom":
          "sheet-out-to-bottom 260ms cubic-bezier(0.4, 0, 1, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
