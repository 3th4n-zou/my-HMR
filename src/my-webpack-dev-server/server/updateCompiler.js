/**
 * 往我们的chunk中偷偷塞入两个文件，webpack-dev-server/client/client.js 和 webpack-dev-server/client/hot-dev-server.js
 */
const path = require('path');

let updateCompiler = (compiler) => {
  const config = compiler.options;
  config.entry = {
    main: [
      path.resolve(__dirname, '../client/index.js'),
      path.resolve(__dirname, '../client/hot/dev-server.js'),
      config.entry,
    ],
  };
  compiler.hooks.entryOption.call(config.context, config.entry);
};

module.exports = updateCompiler;
