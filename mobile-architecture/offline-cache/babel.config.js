module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // O `drizzle/migrations.js` gerado pelo drizzle-kit importa os .sql como
      // string. Sem este plugin o Metro não sabe resolver esse import.
      ['inline-import', { extensions: ['.sql'] }],
    ],
  };
};
