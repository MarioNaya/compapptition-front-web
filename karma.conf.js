// Karma configuration file (Angular 21 + Jasmine).
//
// Reproducible CI: ChromeHeadless con flags --no-sandbox y --disable-gpu para
// entornos headless (CI / WSL). Si el binario portable de puppeteer está
// disponible, lo usa (entorno Linux/CI); si no, deja que karma-chrome-launcher
// detecte el Chrome instalado en el sistema (Windows / macOS dev). Cubre los
// dos casos sin requerir puppeteer en máquinas que ya tienen Chrome.
// singleRun=false en modo dev (watcher Karma);
// `ng test --watch=false` lo sobreescribe a true para CI/PR.

try {
  process.env.CHROME_BIN = require('puppeteer').executablePath();
} catch {
  // puppeteer no instalado o sin Chromium descargado — usar el Chrome del
  // sistema. karma-chrome-launcher lo localizará por la variable PATH.
}

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    client: {
      jasmine: {
        random: false,
      },
      clearContext: false, // deja el reporter visible en --watch
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/compapptition-front-web'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' },
      ],
      // Threshold bloqueante: ng test --code-coverage falla si bajan.
      // Calibrado con margen ~5pp respecto a la cobertura medida tras
      // F1+F2+F2.5 (S+L: ~85% / B: 63% / F: 81%) — actúa como ratchet
      // anti-regresión, no como meta a perseguir.
      check: {
        global: {
          statements: 80,
          branches: 60,
          functions: 78,
          lines: 80,
        },
      },
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadlessCI'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu'],
      },
    },
    singleRun: false,
    restartOnFileChange: true,
  });
};
