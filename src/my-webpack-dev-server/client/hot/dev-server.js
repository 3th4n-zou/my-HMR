/**
 * 负责监听webpackHotUpdate，调用hotCheck开始拉取代码，实现局部更新
 *
 */
let hotEmitter = require('../emitter'); // 和client.js公用一个EventEmitter实例
let currentHash; // 最新编译生成的hash
let lastHash; // 表示上一次编译生成的hash，源码中是hotCurrentHash，为了直接表达他的字面意思换了个名字

// 4. 监听webpackHotUpdate事件,然后执行hotCheck()方法进行检查
hotEmitter.on('webpackHotUpdate', (hash) => {
  currentHash = hash;
  if (!lastHash) {
    // 说明是第一次请求
    return (lastHash = currentHash);
  }
  hotCheck();
});

// 5. 调用hotCheck拉取两个补丁文件
let hotCheck = () => {
  // 6. hotDownloadManifest用来拉取 lasthash.hot-update.json
  hotDownloadManifest()
    .then((hotUpdate) => {
      // {"h":"58ddd9a7794ab6f4e750","c":{"main":true}}
      let chunkIdList = Object.keys(hotUpdate.c);
      // 7. 调用hotDownloadUpdateChunk方法通过JSONP请求获取到最新的模块代码
      chunkIdList.forEach((chunkID) => {
        hotDownloadUpdateChunk(chunkID);
      });
      lastHash = currentHash;
    })
    .catch((err) => {
      // 出错的话直接降级，使用live reload
      window.location.reload();
    });
};

// 6. 拉取lashhash.hot-update.json，向 server 端发送 Ajax 请求，服务端返回一个 Manifest文件(lasthash.hot-update.json)，该 Manifest 包含了本次编译hash值 和 更新模块的chunk名
let hotDownloadManifest = () => {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    let hotUpdatePath = `${lashHash}.hot-update.json`;
    xhr.open('get', hotUpdatePath);
    xhr.onload = () => {
      let hotUpdate = JSON.parse(xhr.responseText);
      resolve(hotUpdate); // {"h":"58ddd9a7794ab6f4e750","c":{"main":true}}
    };
    xhr.onerror = (err) => {
      reject(err);
    };
    xhr.send();
  });
};

// 7. 拉取更新的模块chunkName.lashhash.hot-update.js，通过JSONP请求获取到更新的模块代码，从服务端获取后 可以立即执行js脚本
let hotDownloadUpdateChunk = (chunkID) => {
  let script = document.createElement('script');
  script.charset = 'utf-8';
  script.src = `${chunkID}.${lastHash}.hot-update.js`; // chunkID.xxxlasthash.hot-update.js
  document.head.appendChild(script);
};

// 8.0. 这个hotCreateModule很重要，module.hot的值 就是这个函数执行的结果
// module.hot module.hot.accept module.hot.check
let hotCreateModule = (moduleID) => {
  let hot = {
    // module.hot 属性值
    accept(deps = [], callback) {
      deps.forEach((dep) => {
        // 调用accept将回调函数 保存在module.hot._acceptedDependencies中
        hot.__acceptedDependencies[dep] = callback || function () {};
      });
    },
    check: hotCheck, // module.hot.check === hotCheck
  };
  return hot;
};

// 8. 补丁JS取回来后会调用webpackHotUpdate方法(请看update chunk的格式)，里面会实现模块的热更新
window.webpackHotUpdate = (chunkID, moreModules) => {
  // 9. 热更新的重点代码实现
  // 循环新拉来的模块
  Object.keys(moreModules).forEach((moduleID) => {
    // 1). 通过__webpack_require__.c 模块缓存可以找到旧模块
    let oldModule = __webpack_require__.c[moduleID];
    // 2). 更新__webpack_require__.c，利用moduleID将新的拉来的模块覆盖原来的模块
    let newModule = (__webpack_require__.c[moduleID] = {
      i: moduleID,
      l: false,
      exports: {},
      hot: hotCreateModule(moduleID),
      parents: oldModule.parents,
      children: oldModule.children,
    });
    // 3). 执行最新编译生成的模块代码
    moreModules[moduleID].call(
      newModule.exports,
      newModule,
      newModule.exports,
      __webpack_require__
    );
    newModule.l = true;
  });

  // 这块请回顾下accept的原理
  // 4). 让父模块中存储的_acceptedDependencies执行
  newModule.parents &&
    newModule.parents.forEach((parentID) => {
      let parentModule = __webpack_require__.c[parentID];
      parentModule.hot.__acceptedDependencies[moduleID] &&
        parentModule.hot.__acceptedDependencies[moduleID]();
    });
};

// if (module.hot) {
//   // 是否支持热更新
//   var check = function check() {
//     // module.hot.check就是hotCheck函数，看是不是绕到了HRMPlugin在打包的chunk中注入的HMR runtime代码啦
//     module.hot
//       .check(true).
//       then(/*日志输出*/)
//       .catch(/*日志输出*/);
//   };

//   // 和client/index.js共用一个EventEmitter实例，这里用于监听事件
//   var hotEmitter = require('../emitter.js');

//   // 监听 webpackHotUpdate 事件
//   hotEmitter.on('webpackHotUpdate', function(currentHash) {
//     check();
//   })
// } else {
//   throw new Error('[HMR] Hot Module Replacement is disabled.');
// }
