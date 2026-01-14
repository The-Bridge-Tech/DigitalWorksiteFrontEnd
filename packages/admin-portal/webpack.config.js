const fs = require('fs'); 
const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { merge: webpackMerge } = require('webpack-merge');
const baseConfig = require('@splunk/webpack-configs/base.config').default;
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const entries = fs
    .readdirSync(path.join(__dirname, 'src/main/webapp/pages'))
    .filter((pageFile) => !/^\./.test(pageFile))
    .reduce((accum, page) => {
        accum[page] = path.join(__dirname, 'src/main/webapp/pages', page);
        return accum;
    }, {});

module.exports = webpackMerge(baseConfig, {
    entry: entries,
    output: {
        path: path.join(__dirname, 'stage/appserver/static/pages/'),
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                include: path.resolve(__dirname, '../reporting-center/src'),
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-typescript', {
                                isTSX: true,
                                allExtensions: true
                            }],
                            '@splunk/babel-preset'
                        ],
                    }
                }]
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL),
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(__dirname, 'src/main/resources/splunk'),
                    to: path.join(__dirname, 'stage'),
                },
            ],
        }),
    ],
    devtool: 'eval-source-map',
});