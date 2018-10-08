'use strict';

const { generateServeWebpackConfiguration } = require('./webpack.shared.config');

const webpackConfiguration = generateServeWebpackConfiguration();

if (!webpackConfiguration.devServer) {
  webpackConfiguration.devServer = {};
}

if (!webpackConfiguration.devServer.headers) {
  webpackConfiguration.devServer.headers = {};
}

webpackConfiguration.devServer.headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  ...webpackConfiguration.devServer.headers
}

module.exports = webpackConfiguration;
