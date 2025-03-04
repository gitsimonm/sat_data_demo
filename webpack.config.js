const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const devMode = process.env.NODE_ENV !== "production";
const distPath = path.resolve(__dirname, 'dist');

module.exports = {
  mode: 'production',
  entry: {
    content : '/src/content/content.js',
    login : '/src/login/login.js'
    },
  output: {
    path: distPath,
    filename: '[name]/bundle.js',
    clean : true
  },
  module : {
    rules : [{
          test: /\.css$/,
          use : [ MiniCssExtractPlugin.loader,
                  { loader: 'css-loader', 
                    options: {sourceMap:true}
                  }
                ]
          },
          {
            test: /\.(png|jpe?g|gif|svg)$/i, 
            type: 'asset/resource',  
            generator: {
                filename: 'images/[hash][ext][query]' 
            }
        }
    ]
  },
  plugins: [
      new HtmlWebpackPlugin({
          template: 'src/content/content.html',
          filename : 'content/content.html',
          chunks  : ['content']
        }),
        new HtmlWebpackPlugin({
            template: 'src/login/login.html',
            filename : 'login/login.html',
            chunks  : ['login']
          }),
        new MiniCssExtractPlugin({
          filename : '[name]/style.css'
        })
    ],  
    
};