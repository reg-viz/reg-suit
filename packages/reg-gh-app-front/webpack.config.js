const path = require("path");
const webpack = require("webpack");
const Dotenv = require('dotenv-webpack');

module.exports = function(env) {
  const systemvars = (env && env === "prod");
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
        { test: /\.graphql$/, loader: "raw-loader" },
      ],
    },
    plugins: [
      new webpack.LoaderOptionsPlugin({
        tsConfigPath: path.resolve(__dirname, "src/tsconfig.build.json"),
      }),
      new Dotenv({
        path: path.resolve(__dirname, "../../.env"),
        systemvars,
      }),
    ],
    devServer: {
      port: 4000,
      contentBase: path.join(__dirname, "public"),
    },
    devtool: "source-map",
  };
};
