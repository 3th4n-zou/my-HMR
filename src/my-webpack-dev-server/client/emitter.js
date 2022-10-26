/**
 * 提供一个EventEmitter实例，给./index.js 和 ./hot/dev-server.js使用
 */
const { EventEmitter } = require('events');

// 使用events 发布订阅的模式，主要还是为了解耦
module.exports = new EventEmitter();
