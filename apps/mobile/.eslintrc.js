module.exports = {
  extends: ['@react-native'],
  rules: {
    'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
  },
  overrides: [
    {
      files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'max-lines': 'off',
        'max-lines-per-function': 'off',
      },
    },
  ],
};
