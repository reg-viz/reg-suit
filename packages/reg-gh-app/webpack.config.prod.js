const path = require("path");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const devConf = require("./webpack.config");

module.exports = Object.assign({}, devConf, {
  plugins: [
    new webpack.LoaderOptionsPlugin({
      tsConfigPath: path.resolve(__dirname, "src/tsconfig.json"),
    }),
    new Dotenv({
      path: path.resolve(__dirname, "../../.env.prod"),
      systemvars: true,
    }),
  ],
});
