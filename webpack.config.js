var path = require('path');
var webpack = require('webpack');
var ExternalsPlugin = webpack.ExternalsPlugin;

module.exports = {
  devtool: 'eval',
  entry: [
    'webpack-dev-server/client?http://localhost:3002',
    'webpack/hot/only-dev-server',
    './src/js/app'
  ],
  output: {
    path: path.join(__dirname, 'src','dist'),
    filename: 'bundle.js',
    publicPath: '/dist/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ExternalsPlugin('commonjs', [
      'monk',
    ])
  ],
  module: {
    loaders: [
      { test: /\.css$/, loader: "style-loader!css-loader" },
      { test: /\.png$/, loader: "url-loader?limit=100000" },
      { test: /\.jpg$/, loader: "file-loader" },
      { test: /\.json$/, loader: "json-loader" },
      {
        test: /\.js$/,
        loaders: ['react-hot', 'babel'],
        include: path.join(__dirname, 'src')
      }
    ]
  },
  target: 'electron-renderer'
};
