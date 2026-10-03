/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Merged with jest-expo's own setupFiles (Jest concatenates preset + project setupFiles).
  setupFiles: ['<rootDir>/jest.setup.ts'],
};
