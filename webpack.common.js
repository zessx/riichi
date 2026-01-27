const path = require('path');
const fs = require('fs');
const HtmlBundlerPlugin = require('html-bundler-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

function getDownloads() {
  const files = fs.readdirSync('src/downloads/')
  const data = {}
  files.forEach((file) => {
    if (file.match(/\.(pdf|jpg)$/)) {
      const metadata = /^(?<type>.+?)-v(?<version>[\d\.]+?)-(?<language>\w\w)\.(?<format>.+)$/.exec(file).groups;
      if (!(metadata.type in data)) {
        data[metadata.type] = {}
      }
      if (!(metadata.language in data[metadata.type])) {
        data[metadata.type][metadata.language] = {}
      }
      data[metadata.type][metadata.language][metadata.format] = metadata.version
    }
  })
  return data
}

module.exports = {
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },

  resolve: {
    alias: {
      '@images': path.join(__dirname, 'src/images'),
      '@styles': path.join(__dirname, 'src/scss'),
    },
  },

  plugins: [
    new HtmlBundlerPlugin({
      entry: [
        {
          import: 'src/index.html',
          filename: 'index.html',
          data: {
            downloads: getDownloads(),
          },
        },
      ],
      css: {
        filename: 'css/[name].[contenthash:8].css',
      },
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/downloads', to: 'doc' },
        { from: 'src/robots.txt', to: 'robots.txt' },
      ],
    }),
  ],

  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: ['css-loader', 'sass-loader'],
      },
      {
        test: /\.(ico|png|jp?g|svg)/,
        type: 'asset',
        generator: {
          filename: 'img/[name].[hash:8][ext]',
        },
        parser: {
          dataUrlCondition: {
            // inline images < 2 KB
            maxSize: 2 * 1024,
          },
        },
      },
    ],
  },
};
