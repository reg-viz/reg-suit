const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: {
    handler: path.resolve(__dirname, "src/index.ts"),
  },
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "bundle.js",
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
  ],
}
