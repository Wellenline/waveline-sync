const path = require("path");

module.exports = {
	mode: process.NODE_ENV || "development",
	entry: "./src/app.ts",
	target: "node",
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "app.js"
	},
	node: {
		__dirname: false
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/
			},
			{
				test: /\.(png|jpe?g|gif|svg)$/i,
				use: [{ loader: "file-loader" }]
			},
			{
				test: /\.node/i,
				use: [
					{ loader: "node-loader" },
					{
						loader: "file-loader",
						options: {
							name: "[name].[ext]"
						}
					}
				]
			}
		]
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"]
	}
};
