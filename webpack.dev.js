const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	mode: 'development',
	output: {
		filename: '[contenthash].js',
	},
	devtool: false,
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env'],
						plugins: ['@babel/plugin-transform-runtime'],
						cacheDirectory: true,
					},
				},
			},
			{
				test: /\.html$/,
				use: 'html-loader',
			},
			{
				test: /\.s(c|a)ss$/,
				use: ['style-loader', 'css-loader', 'sass-loader'],
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/template.html',
		}),
	],
};
