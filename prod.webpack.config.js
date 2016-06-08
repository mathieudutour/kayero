var path = require('path');
var webpack = require('webpack');
var ExternalsPlugin = webpack.ExternalsPlugin;

module.exports = {
  entry: [
    './src/js/app'
  ],
  output: {
    path: path.join(__dirname, 'src','dist'),
    filename: 'bundle.js',
    publicPath: '../src/dist/'
  },
  plugins: [
    new ExternalsPlugin('commonjs', [
      'monk',
    ]),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
  ],
  module: {
    loaders: [
      { test: /\.css$/, loader: "style-loader!css-loader" },
      {
        test: /\.scss$/,
        loaders: ["style", "css", "sass"]
      },
      { test: /\.png$/, loader: "url-loader?limit=100000" },
      { test: /\.jpg$/, loader: "file-loader" },
      { test: /\.json$/, loader: "json-loader" },
      {
        test   : /\.(ttf|eot|svg|otf|woff(2)?)(\?[a-z0-9=&.]+)?$/, // font files
        loader : 'file-loader'
      },
      {
        test: /\.js$/,
        loaders: ['react-hot', 'babel'],
        include: path.join(__dirname, 'src')
      }
    ]
  },
  target: 'electron-renderer'
};
