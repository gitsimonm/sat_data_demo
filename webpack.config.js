const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const devMode = process.env.NODE_ENV !== "production";

module.exports = {
  mode: 'production',
  entry: {
    content : '/src/script.js',
    login : '/src/login.js'
    },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: '[name].js',
  },
//   target: 'node',
  plugins: [
      new HtmlWebpackPlugin({
          template: 'src/content.html',
          filename : 'content.html',
           scriptLoading : 'module',
            chunks  : ['content']
        }),
        new HtmlWebpackPlugin({
            template: 'src/login.html',
            filename : 'login.html',
             scriptLoading : 'module',
            chunks  : ['login']
          }),
        new MiniCssExtractPlugin()
    ],  
    module : {
      rules : [{
            test: /\.(sa|sc|c)ss$/i,
            use : [MiniCssExtractPlugin.loader,
                {loader: 'css-loader', options: {sourceMap:true}}
                ]
            },
            {
                test : /\.html$/i,
                use : ['html-loader'],
            }]
      },

};