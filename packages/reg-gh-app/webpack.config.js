const path = require("path");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");

module.exports = function(env) {
  return {
    entry: {
      handler: path.resolve(__dirname, "src/handler.ts"),
    },
    node: {
      __filename: false,
      __dirname: false,
    },
    target: "node",
    output: {
      libraryTarget: "commonjs",
      path: path.resolve(__dirname, "dist"),
      filename: "handler.js",
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        { test: /\.ts$/, exclude: /node_modules/, loader: "light-ts-loader" },
        { test: /\.pem$/, loader: "raw-loader" },
        { test: /\.graphql$/, loader: "raw-loader" },
      ],
    },
    plugins: [
      new webpack.LoaderOptionsPlugin({
        tsConfigPath: path.resolve(__dirname, "src/tsconfig.json"),
      }),
      (env && env === "prod") ? new Dotenv({
        path: path.resolve(__dirname, "../../.env.prod"),
        systemvars: true,
      }) : new Dotenv({
        path: "../../.env",
      }),
    ],
  };
}
