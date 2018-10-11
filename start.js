require('@babel/register')({
    presets: [ '@babel/env' ],
    plugins: ["@babel/proposal-class-properties"]

});
require("@babel/polyfill");

process.env.NTBA_FIX_319 = 1;

module.exports = require('./src/server/app.js');