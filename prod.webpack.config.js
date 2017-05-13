const path = require('path')
const webpack = require('webpack')
const ExternalsPlugin = webpack.ExternalsPlugin

module.exports = {
  devtool: 'source-map',
  entry: [
    './src/js/app'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '../dist/'
  },
  plugins: [
    new ExternalsPlugin('commonjs', [
      'monk'
    ]),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    })
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
        loaders: ['babel-loader'],
        include: path.join(__dirname, 'src')
      }
    ]
  },
  target: 'electron-renderer'
}
