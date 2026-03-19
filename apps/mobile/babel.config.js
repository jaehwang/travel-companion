module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(() => isTest);
  return {
    presets: [
      ['babel-preset-expo', isTest ? { reanimated: false } : {}],
    ],
    plugins: isTest ? [] : [],
  };
};
