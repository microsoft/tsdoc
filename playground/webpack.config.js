'use strict';

const path = require('path');

/**
 * require() an importPath using another NPM package's folder as
 * the base directory for module resolution
 */
function requireRelativeTo(importPath, otherPackage) {
  const baseFolder = path.dirname(require.resolve(`${otherPackage}/package.json`));
  const targetPath = require.resolve(importPath, { paths: [baseFolder] });
  return require(targetPath);
}

const createWebpackConfig = require('@rushstack/heft-web-rig/profiles/app/webpack-base.config');

const HtmlWebpackPlugin = requireRelativeTo('html-webpack-plugin', '@rushstack/heft-web-rig');

const REACT_URL = {
  dev: 'https://cdnjs.cloudflare.com/ajax/libs/react/16.4.2/umd/react.development.js',
  production: 'https://cdnjs.cloudflare.com/ajax/libs/react/16.4.2/umd/react.production.min.js'
};
const REACT_DOM_URL = {
  dev: 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/16.4.2/umd/react-dom.development.js',
  production: 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/16.4.2/umd/react-dom.production.min.js'
};
const REACT_DOM_SERVER_URL = {
  dev: 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/16.5.1/umd/react-dom-server.browser.development.js',
  production:
    'https://cdnjs.cloudflare.com/ajax/libs/react-dom/16.5.1/umd/react-dom-server.browser.production.min.js'
};
const MONACO_URL = {
  dev: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.14.3/min/',
  production: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.14.3/min/'
};

module.exports = function createConfig(env, argv) {
  const isProduction = env.production;
  console.log(`isProduction=${isProduction}`);
  const monacoUrl = isProduction ? MONACO_URL.production : MONACO_URL.dev;
  return createWebpackConfig({
    env: env,
    argv: argv,
    projectRoot: __dirname,
    // Documentation: https://webpack.js.org/configuration/
    configOverride: {
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/server': 'ReactDOMServer'
      },
      plugins: [
        new HtmlWebpackPlugin({
          inject: true,
          template: `handlebars-loader!${path.join(__dirname, 'public', 'index.hbs')}`,
          chunks: {},
          templateParameters: {
            scriptsToInclude: [
              { url: isProduction ? REACT_URL.production : REACT_URL.dev },
              { url: isProduction ? REACT_DOM_URL.production : REACT_DOM_URL.dev },
              { url: isProduction ? REACT_DOM_SERVER_URL.production : REACT_DOM_SERVER_URL.dev },
              { url: `${monacoUrl}vs/loader.js` }
            ]
          }
        }),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new webpack.DefinePlugin({
          MONACO_URL: JSON.stringify(monacoUrl)
        })
      ]
    }
  });
};
