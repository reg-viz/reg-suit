const path = require("path");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

const basePlugins = [
  new webpack.LoaderOptionsPlugin({
    tsConfigPath: path.resolve(__dirname, "src/tsconfig.build.json"),
  }),
  new ExtractTextPlugin({
    filename: "style.css",
    allChunks: true,
  }),
];

module.exports = function(env) {
  let plugins;
  if (env && env === "prod") {
    plugins = [
      ...basePlugins,
      new Dotenv({
        path: path.resolve(__dirname, "../../.env.prod"),
        systemvars: true,
      }),
      new UglifyJSPlugin(),
    ];
  } else {
    plugins = [
      ...basePlugins,
      new Dotenv({
        path: path.resolve(__dirname, "../../.env"),
        systemvars: false,
      }),
    ];
  }
  return {
    entry: {
      main: path.resolve(__dirname, "src/index.ts"),
      auth: path.resolve(__dirname, "src/auth.ts"),
    },
    output: {
      path: path.resolve(__dirname, "public"),
      filename: "[name].js",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
    },
    module: {
      rules: [
        { test: /\.tsx?$/, exclude: /node_modules/, loader: "light-ts-loader" },
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract([
            {
              loader: "css-loader",
              options: {
                modules:true, 
                localIdentName: env !== "prod" ? "[name]_[local]" : "[hash:base64]"
              },
            },
            "postcss-loader"
          ]),
        },
      ],
    },
    plugins,
    devServer: {
      port: 4000,
      contentBase: path.join(__dirname, "public"),
    },
    devtool: "source-map",
  };
};
