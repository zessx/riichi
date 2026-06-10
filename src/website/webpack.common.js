const path = require('path');
const fs = require('fs');
const HtmlBundlerPlugin = require('html-bundler-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const ROOT = path.resolve(__dirname, '../..');

function getDocuments() {
  const files = fs.readdirSync(path.join(ROOT, 'dist/sheets'))
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
    path: path.join(ROOT, 'dist/website'),
    clean: true,
  },

  resolve: {
    alias: {
      '@images': path.join(__dirname, 'images'),
      '@styles': path.join(__dirname, 'scss'),
    },
  },

  plugins: [
    new HtmlBundlerPlugin({
      entry: [
        {
          import: 'src/website/index.html',
          filename: 'index.html',
          data: {
            documents: getDocuments(),
          },
        },
      ],
      css: {
        filename: 'css/[name].[contenthash:8].css',
      },
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/website/doc', to: 'doc' },
        { from: 'src/website/robots.txt', to: 'robots.txt' },
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
