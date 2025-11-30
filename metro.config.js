// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for InternalBytecode.js error - improve source map handling
// The InternalBytecode.js file exists in the root to prevent ENOENT errors
// during Metro's stack trace symbolication process

// Improve source map handling
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [],
};

// Improve error handling in transformer
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;

