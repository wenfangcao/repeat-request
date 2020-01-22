var qs = require('qs')
var requestMap = {}

// 判断请求是否重复
function analyRequest (args) {
  var keyString = qs.stringify(args)
  return requestMap[keyString]
}

// 设置方法回调
function initQueue (args) {
  var keyString = qs.stringify(args)
  requestMap[keyString] = []
}

// 移除队列信息
function removeQueue (keyString) {
  delete requestMap[keyString]
}

// 重复的请求, 均返回相同的相应
function enterQueue (args) {
  return new Promise(resolve => {
    var queue = analyRequest(args)
    queue.push(res => resolve(res))
  })
}

function setHeaderKeyString (config) {
  var keyString = qs.stringify([
    config.method,
    config.url,
    config.data,
    config.params
  ])
  return Object.assign(config, { _keyString: keyString })
}

// 通知队列统一返回相应
function subscribeResponse (response) {
  var keyString = response.response.config._keyString
  let queue = requestMap[keyString]
  if (queue && queue.length) {
    console.log('统一清除队列', queue)
    queue.forEach(resolveFun => resolveFun(response))
  }
  removeQueue()
}

module.exports = {
  analyRequest,
  initQueue,
  enterQueue,
  setHeaderKeyString,
  subscribeResponse
}

