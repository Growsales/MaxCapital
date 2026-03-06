// Delegates to root PostCSS/Tailwind config.
// Story 1.4 will remove this when src/ moves into packages/web/.
export default {
  plugins: {
    tailwindcss: { config: '../../tailwind.config.ts' },
    autoprefixer: {},
  },
};
