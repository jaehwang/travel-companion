import type { Config } from "tailwindcss";

export default {
  darkMode: 'media',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:    'var(--background)',
        foreground:    'var(--foreground)',
        primary:       'var(--color-primary)',
        'primary-bg':  'var(--color-primary-bg)',
        danger:        'var(--color-danger)',
        'danger-bg':   'var(--color-danger-bg)',
        'c-border':    'var(--color-border)',
        'text-main':   'var(--color-text)',
        'text-sub':    'var(--color-text-sub)',
        'text-muted':  'var(--color-text-muted)',
        'bg-muted':    'var(--color-bg-muted)',
      },
      fontSize: {
        'title': 'var(--font-title)',
        'fxl':   'var(--font-xl)',
        'flg':   'var(--font-lg)',
        'fmd':   'var(--font-md)',
        'fbase': 'var(--font-base)',
        'fsm':   'var(--font-sm)',
        'fxs':   'var(--font-xs)',
      },
    },
  },
  plugins: [],
} satisfies Config;
