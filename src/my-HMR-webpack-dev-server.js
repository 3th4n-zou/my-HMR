/*
热更新服务端注入入口
*/
const webpack = require('webpack');
const Server = require('./my-webpack-dev-server/server/Server');
const config = require('../webpack.config');

// 1. 创建webpack实例
const compiler = webpack(config);
// 2. 创建 Server 类，这个类包含了 webpack-dev-server 服务端的主要逻辑
const server = new Server(compiler);

// 10. 启动 webserver 服务器
server.listen(8000, 'localhost', () => {
  console.log('Project is running at http://localhost:8000/');
});
