var hostConfig = require('./host.js');
var axios = require('axios');
var repeatRequest = require('./repeatRequest.js')

require('es6-promise').polyfill() // axios使用了promise，默认babel不会兼容node_module依赖的库，所以增加promise兼容

var rootInstance = null;
function getOneInstance () { // 获取一个instance
  var instance = axios.create({
    baseURL: hostConfig.getUrl()
  });
  return instance
}

function refreshInstance () { // 更新instance
  rootInstance = getOneInstance()
  registErrorcodeInterceptor() // 注册错误码拦截器
  initRepeatRequestInterceptors()
}

// 封装instance方法
function instance (method, url, data, option) {
  if (!method || !url) {
    throw new Error('缺少参数');
  }

  var isRepeat = repeatRequest.analyRequest(arguments)
  if (isRepeat) {
    return repeatRequest.enterQueue(arguments)
  } else {
    repeatRequest.initQueue(arguments)
  }

  switch(method) {
    case 'get': {
      var requestData = Object.assign({}, {
        params: data
      }, option)
      return rootInstance.get(url, requestData);
    }
    case 'delete': {
      var requestData = Object.assign({}, {
        params: data
      }, option)
      return rootInstance.delete(url, requestData);
    }
    case 'post': return rootInstance.post(url, data, option);
    case 'put': return rootInstance.put(url, data, option);
    case 'options': return rootInstance.options(url, data);
    case 'patch': return rootInstance.patch(url, data, option);
    case 'head': return rootInstance.head(url, data);
    default: return rootInstance.get(url, data, option);
  }
}
// 注册返回拦截器
function registResponseInterceptors (successHandle, failHandle) {
  return rootInstance.interceptors.response.use(successHandle, failHandle);
}
// 移除拦截器
function removeResponseTnterceptors (interceptorInstance) {
  rootInstance.interceptors.response.eject(interceptorInstance)
}
// 注册请求拦截器
function registRequestInterceptors (successHandle, failHandle) {
  return rootInstance.interceptors.request.use(successHandle, failHandle);
}
// 移除拦截器
function removeRequestInterceptors (interceptorInstance) {
  rootInstance.interceptors.request.eject(interceptorInstance)
}
function initRepeatRequestInterceptors () {
  registRequestInterceptors(
    config => {
      repeatRequest.setHeaderKeyString(config)
      return config
    },
    error => Promise.reject(error)
  )

  registResponseInterceptors(
    response => {
      repeatRequest.subscribeResponse(response)
      return response
    },
    error => error
  )
}

refreshInstance();
