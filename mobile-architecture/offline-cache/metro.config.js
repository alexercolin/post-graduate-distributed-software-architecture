const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Os arquivos de migration são código-fonte, não asset: o bundler precisa
// tratá-los como módulo para o `inline-import` transformá-los em string.
config.resolver.sourceExts.push('sql');

module.exports = config;
