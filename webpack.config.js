const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: './src/index.ts',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js'
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	devServer: {
		port: 9090,
		// host: '0.0.0.0',
		contentBase: path.join(__dirname, "dist"),

	},
	module: {
		rules: [{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
				options: {
					presets: ['@babel/preset-env']
				}
			},
			{
				test: /\.tsx?$/,
				use: [{
					loader: require.resolve('awesome-typescript-loader'),
				}],
				exclude: /node_modules/
			},
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.s[ac]ss$/i,
				use: ['style-loader', 'css-loader', 'sass-loader'],
			},
			// {
			// 	// Load all images as base64 encoding if they are smaller than 8192 bytes
			// 	test: /\.(png|jpg|gif)$/,
			// 	use: [{
			// 		loader: 'url-loader',
			// 		options: {
			// 			// On development we want to see where the file is coming from, hence we preserve the [path]
			// 			name: '[path][name].[ext]?hash=[hash:20]',
			// 			limit: 8192
			// 		}
			// 	}]
			// },
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: [
					'file-loader',
				],
			},
			{
				test: /\.(stl|obj|mtl)$/,
				use: [
					'raw-loader',
				],
			},

			{
				// Load all icons
				test: /\.(eot|woff|woff2|svg|ttf)([\?]?.*)$/,
				use: [{
					loader: 'file-loader',
				}]
			},
			{
				test: /\.(glsl|vs|fs|vert|frag)$/,
				exclude: /node_modules/,
				use: [
					'raw-loader',
					'glslify-loader'
				]
			}
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/index.html',
		})
	]
};
