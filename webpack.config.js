const Encore = require('@symfony/webpack-encore')
const webpack = require('webpack')

if (!Encore.isRuntimeEnvironmentConfigured()) {
    Encore.configureRuntimeEnvironment(process.env.NODE_ENV || 'dev');
}

Encore
    .setOutputPath('public/assets')

    .setPublicPath('/assets/')

    .addEntry('app', '/res/js/app.js')

    .addPlugin(new webpack.ProvidePlugin({
        process: 'process/browser',
    }))

    .enableVueLoader()
    .cleanupOutputBeforeBuild()
    .enableBuildNotifications()
    .enableSingleRuntimeChunk()
    .enableSourceMaps(!Encore.isProduction())
    .enableVersioning(Encore.isProduction())

module.exports = Encore.getWebpackConfig()