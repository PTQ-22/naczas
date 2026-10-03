// Expo SDK 52+ configures Metro for pnpm workspaces automatically (watchFolders, nodeModulesPaths),
// so workspace packages exporting raw TS (@naczas/shared, @naczas/rules) resolve without extra setup.
// Do not add watchFolders/extraNodeModules here — Expo docs say it breaks the auto-config.
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
