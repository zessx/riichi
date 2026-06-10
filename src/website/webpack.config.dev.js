const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',

  // enable HMR with live reload
  devServer: {
    static: common.output.path,
    watchFiles: {
      paths: ['./**/*.*'],
      options: {
        usePolling: true,
      },
    },
  },
});
