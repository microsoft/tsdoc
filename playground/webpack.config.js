'use strict';

const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const RIG_BASE_PATH = path.dirname(require.resolve('@rushstack/heft-web-rig/package.json'));

/**
 * require.resolve() an importPath using another NPM package's folder as
 * the base directory for module resolution
 */
function getPackagePathRelativeToRig(importPath) {
  const targetPath = require.resolve(importPath, { paths: [RIG_BASE_PATH] });
  return targetPath;
}

/**
 * require() an importPath using another NPM package's folder as
 * the base directory for module resolution
 */
function requireRelativeToRig(importPath) {
  const targetPath = getPackagePathRelativeToRig(importPath);
  return require(targetPath);
}

const createWebpackConfig = require('@rushstack/heft-web-rig/profiles/app/webpack-base.config');

const webpack = requireRelativeToRig('webpack');
const HtmlWebpackPlugin = requireRelativeToRig('html-webpack-plugin');

module.exports = function createConfig(env, argv) {
  return createWebpackConfig({
    env: env,
    argv: argv,
    projectRoot: __dirname,
    // Documentation: https://webpack.js.org/configuration/
    configOverride: {
      module: {
        rules: [
          {
            // For the lib/samples files which are imported as source code
            test: /\.ts$/,
            type: 'asset/source'
          },
          // The following rules are needed to support the Monaco Editor
          {
            test: /\.css$/,
            use: [getPackagePathRelativeToRig('style-loader'), getPackagePathRelativeToRig('css-loader')],
            include: /node_modules[\/\\]monaco-editor/
          },
          {
            test: /\.ttf$/,
            type: 'asset/resource',
            include: /node_modules[\/\\]monaco-editor/
          }
        ]
      },
      plugins: [
        new HtmlWebpackPlugin({
          inject: true,
          template: `handlebars-loader!${__dirname}/public/index.hbs`,
          chunks: {}
        }),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new webpack.DefinePlugin({
          COMMIT_ID: `'${process.env['BUILD_SOURCEVERSION'] || 'COMMIT_SHA'}'`
        }),
        new MonacoWebpackPlugin()
      ],
      performance: {
        hints: false
      }
    }
  });
};
