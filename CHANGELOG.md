# Changelog

## [2.0.0](https://github.com/ikuo-suyama/gwt/compare/v1.2.1...v2.0.0) (2025-12-11)


### ⚠ BREAKING CHANGES

* Drop Node.js 18 support. Minimum required version is now Node.js 20.

### Features

* add one-line shell integration installer ([#18](https://github.com/ikuo-suyama/gwt/issues/18)) ([51112cc](https://github.com/ikuo-suyama/gwt/commit/51112ccbaac93d21a677dba88b6fd77447398165))


### Bug Fixes

* read version dynamically from package.json ([#15](https://github.com/ikuo-suyama/gwt/issues/15)) ([1bb73f7](https://github.com/ikuo-suyama/gwt/commit/1bb73f7592f575a09f379b1091cb79e4f6c31c02))


### Continuous Integration

* upgrade to Node.js 20 and update npm for OIDC publishing ([#16](https://github.com/ikuo-suyama/gwt/issues/16)) ([53fae20](https://github.com/ikuo-suyama/gwt/commit/53fae2049de370b0cd624978a0c5806492124ce5))

## [1.2.1](https://github.com/ikuo-suyama/gwt/compare/v1.2.0...v1.2.1) (2025-12-10)


### Bug Fixes

* exclude tests from TypeScript compilation ([#13](https://github.com/ikuo-suyama/gwt/issues/13)) ([73e842c](https://github.com/ikuo-suyama/gwt/commit/73e842c73fa5605b63d97a84d8fe561b7bd25781))

## [1.2.0](https://github.com/ikuo-suyama/gwt/compare/v1.1.0...v1.2.0) (2025-12-10)


### Features

* add branch name support to switch command ([#8](https://github.com/ikuo-suyama/gwt/issues/8)) ([2deeba7](https://github.com/ikuo-suyama/gwt/commit/2deeba70df83467747fcf02b814dc59e00e26224))


### Bug Fixes

* remove registry-url to enable Trusted Publishing OIDC auth ([5e94992](https://github.com/ikuo-suyama/gwt/commit/5e949923154c63ffcbd2507acbc34737855ed2d8))

## [1.1.0](https://github.com/ikuo-suyama/gwt/compare/v1.0.0...v1.1.0) (2025-12-10)


### Features

* Add CI/CD with GitHub Actions and pre-commit hooks ([#1](https://github.com/ikuo-suyama/gwt/issues/1)) ([c475a1d](https://github.com/ikuo-suyama/gwt/commit/c475a1d4532d2eaf7b163b58072cb8b1d374c3a1))
* use Trusted Publishing for npm publish ([#6](https://github.com/ikuo-suyama/gwt/issues/6)) ([8081b3e](https://github.com/ikuo-suyama/gwt/commit/8081b3e71283f54ef143f573ae1953c54d702e44))


### Bug Fixes

* change release-please trigger branch from main to master ([#5](https://github.com/ikuo-suyama/gwt/issues/5)) ([90131c2](https://github.com/ikuo-suyama/gwt/commit/90131c2707fe3d19166a70daab258fc52952d318))
* remove E2E test step from manual-release workflow ([#7](https://github.com/ikuo-suyama/gwt/issues/7)) ([c0a1233](https://github.com/ikuo-suyama/gwt/commit/c0a1233f43bed099758b1d761ea508bff0df8dd3))
