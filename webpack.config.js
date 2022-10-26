let webpack = require('webpack');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js', // 这里我们还没有将客户端代码配置，而是通过updateCompiler方法更改entry属性
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin(), // 输出一个html，并将打包的chunk引入
    new webpack.HotModuleReplacementPlugin(), // 注入HMR runtime代码
  ],
};
