const path = require("path");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

module.exports = function(env) {
  const plugins = (env && env === "prod") ? [
    new webpack.LoaderOptionsPlugin({
      tsConfigPath: path.resolve(__dirname, "src/tsconfig.build.json"),
    }),
    new Dotenv({
      path: path.resolve(__dirname, "../../.env.prod"),
      systemvars: true,
    }),
    new UglifyJSPlugin(),
  ] : [
    new webpack.LoaderOptionsPlugin({
      tsConfigPath: path.resolve(__dirname, "src/tsconfig.build.json"),
    }),
    new Dotenv({
      path: path.resolve(__dirname, "../../.env"),
      systemvars: false,
    }),
  ];
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
        { test: /\.css$/, loaders: ["style-loader", "css-loader?modules"] },
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
