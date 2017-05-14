const path = require('path')
const webpack = require('webpack')
const ExternalsPlugin = webpack.ExternalsPlugin
const WriteFilePlugin = require('write-file-webpack-plugin')

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: [
    'webpack-dev-server/client?http://localhost:3002',
    'webpack/hot/only-dev-server',
    './src/js/app'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: 'http://localhost:3002/dist/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ExternalsPlugin('commonjs', [
      'monk'
    ]),
    new WriteFilePlugin()
  ],
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader']
      },
      { test: /\.png$/, loader: 'url-loader?limit=100000' },
      { test: /\.(jpg|gif|png)$/, loader: 'file-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      {
        test: /\.(ttf|eot|svg|otf|woff(2)?)(\?[a-z0-9=&.]+)?$/, // font files
        loader: 'file-loader'
      },
      {
        test: /\.js$/,
        loaders: ['react-hot-loader', 'babel-loader'],
        include: path.join(__dirname, 'src')
      }
    ]
  },
  target: 'electron-renderer'
}
