'use strict';

const webpack = require('webpack');
const path = require('path');
const { SetPublicPathPlugin } = require('@rushstack/set-webpack-public-path-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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

module.exports.generateBuildWebpackConfiguration = function (env) {
  return _generateBaseWebpackConfiguration((env || {}).production);
};

module.exports.generateServeWebpackConfiguration = function () {
  const result = _generateBaseWebpackConfiguration(false);
  result.devServer = {
    contentBase: '.',
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  };

  return result;
};

function _generateBaseWebpackConfiguration(isProduction) {
  const distDirectory = path.join(__dirname, 'dist');
  const monacoUrl = isProduction ? MONACO_URL.production : MONACO_URL.dev;

  const configuration = {
    mode: isProduction ? 'production' : 'development',
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [require.resolve('style-loader'), require.resolve('css-loader')]
        },
        {
          test: /\.(scss|sass)$/,
          use: [
            require.resolve('style-loader'),
            require.resolve('css-loader'),
            require.resolve('sass-loader')
          ]
        },
        {
          test: /\.(png|woff|woff2|eot|svg)$/,
          loader: require.resolve('file-loader'),
          options: {
            name: '[name].[ext]'
          }
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        tslib: 'tslib/tslib.es6'
      }
    },
    devtool: isProduction ? undefined : 'source-map',
    entry: {
      'tsdoc-playground': path.join(__dirname, 'lib', 'index.js')
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      'react-dom/server': 'ReactDOMServer'
    },
    output: {
      libraryTarget: 'this',
      path: distDirectory,
      filename: '[name].js',
      chunkFilename: '[id].[name].js'
    },
    optimization: {
      minimize: isProduction
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
      new SetPublicPathPlugin({
        scriptName: {
          isTokenized: true,
          name: '[name]_?[a-zA-Z0-9-_]*.js'
        }
      }),
      new BundleAnalyzerPlugin({
        openAnalyzer: false,
        analyzerMode: 'static',
        reportFilename: path.join(__dirname, 'temp', 'tsdoc-playground.stats.html'),
        generateStatsFile: true,
        statsFilename: path.join(__dirname, 'temp', 'tsdoc-playground.stats.json'),
        logLevel: 'error'
      }),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new webpack.DefinePlugin({
        COMMIT_ID: `'${process.env['BUILD_SOURCEVERSION'] || 'COMMIT_SHA'}'`,
        DEBUG: !isProduction,
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'dev'),
        MONACO_URL: JSON.stringify(monacoUrl)
      })
    ],
    performance: {
      hints: false
    }
  };

  return configuration;
}
