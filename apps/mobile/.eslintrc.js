module.exports = {
  extends: ['@react-native'],
  ignorePatterns: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
  rules: {
    'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
  },
};
