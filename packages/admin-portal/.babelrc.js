module.exports = {
    presets: [
        ['@babel/preset-typescript', {
            isTSX: true,
            allExtensions: true
        }],
        '@splunk/babel-preset'
    ],
};
