var webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  entry: [
    './client/index.js'
  ],
  output: {
    path: './dist/js',
    filename: 'bundle.js',
    publicPath: '/js/'
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    githubAuthTokenPlugin
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: [ 'babel' ],
        exclude: /node_modules/
      },
      {
        test: /\.css?$/,
        loaders: [ 'style', 'raw' ]
      },
      {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  }
};
