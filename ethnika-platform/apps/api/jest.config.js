/** Tests unitaires : fichiers *.spec.ts à côté du code. Les tests e2e (base réelle) sont dans test/. */
module.exports = {
  rootDir: "src",
  testRegex: ".*\.spec\.ts$",
  transform: { "^.+\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json" }] },
  moduleFileExtensions: ["ts", "js", "json"],
  testEnvironment: "node",
  clearMocks: true,
};
