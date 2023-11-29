/**
 * Created by PanJiaChen on 16/11/18.
 */
import Dates from '@/utils/datetime'

/** 根据指定时间的毫秒数，获取指定时间距离当前时间的文本
  * @param time {number} time 指定时间的毫秒数
  * @param format {string} 格式化字符串 'YYYY-MM-DD HH:mm:ss'
  * @returns {string}
  */
export function formatTime(time, format = null) {
  if (('' + time).length === 10) {
    // time = parseInt(time) * 1000
    time = time * 1000
  } else {
    time = +time
  }
  const d = new Date(time)
  const now = Date.now()

  const diff = (now - time) / 1000

  if (diff < 30) {
    return '刚刚'
  } else if (diff < 3600) {
    // less 1 hour
    return Math.ceil(diff / 60) + '分钟前'
  } else if (diff < 3600 * 24) {
    return Math.ceil(diff / 3600) + '小时前'
  } else if (diff < 3600 * 24 * 2) {
    return '1天前'
  }
  if (format) {
    let t = new Dates(time).strftime(format)
    return t
  } else {
    return d.getMonth() + 1 + '月' + d.getDate() + '日' + d.getHours() + '时' + d.getMinutes() + '分'
  }
}
/**
  * 获取当前url的指定参数名的值
  * @param name 参数名
  */
export function getParamsNameValue(name) {
  let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)')
  let r = window.location.search.substring(1).match(reg)
  if (r != null) return encodeURIComponent(r[2])
  return null
}
/**
  * 获取指定url的参数
  * @param {string} url
  * @returns {Object}
  */
export function getQueryObject(url) {
  url = url == null ? window.location.href : url
  const search = url.substring(url.lastIndexOf('?') + 1)
  const obj = {}
  const reg = /([^?&=]+)=([^?&=]*)/g
  search.replace(reg, (rs, $1, $2) => {
    const name = decodeURIComponent($1)
    let val = decodeURIComponent($2)
    val = String(val)
    obj[name] = val
    return rs
  })
  return obj
}

/**
  * 合并两个对象，赋予最后一个对象优先权
  * @param {Object} target
  * @param {(Object|Array)} source
  * @returns {Object}
  */
export function objectMerge(target, source) {
  if (typeof target !== 'object') {
    target = {}
  }
  if (Array.isArray(source)) {
    return source.slice()
  }
  Object.keys(source).forEach(property => {
    const sourceProperty = source[property]
    if (typeof sourceProperty === 'object') {
      target[property] = objectMerge(target[property], sourceProperty)
    } else {
      target[property] = sourceProperty
    }
  })
  return target
}

/**
  * 防抖
  * @param {Function} func
  * @param {number} wait
  * @param {boolean} immediate
  * @return {*}
  */
export function debounce(func, wait, immediate) {
  let timeout, args, context, timestamp, result

  const later = function () {
    // 据上一次触发时间间隔
    const last = +new Date() - timestamp

    // 上次被包装函数被调用时间间隔 last 小于设定时间间隔 wait
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last)
    } else {
      timeout = null
      // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
      if (!immediate) {
        result = func.apply(context, args)
        if (!timeout) context = args = null
      }
    }
  }

  return function (...args) {
    // context = this //会报错，先注释调了
    timestamp = +new Date()
    const callNow = immediate && !timeout
    // 如果延时不存在，重新设定延时
    if (!timeout) timeout = setTimeout(later, wait)
    if (callNow) {
      result = func.apply(context, args)
      context = args = null
    }

    return result
  }
}

/**
  * This is just a simple version of deep copy
  * Has a lot of edge cases bug
  * If you want to use a perfect deep copy, use lodash's _.cloneDeep
  * @param {Object} source
  * @returns {Object}
  */
export function deepClone(source) {
  if (!source && typeof source !== 'object') {
    // throw new Error('error arguments', 'deepClone')
    throw new Error('error arguments')
  }
  const targetObj = source.constructor === Array ? [] : {}
  Object.keys(source).forEach(keys => {
    if (source[keys] && typeof source[keys] === 'object') {
      targetObj[keys] = deepClone(source[keys])
    } else {
      targetObj[keys] = source[keys]
    }
  })
  return targetObj
}

// 替换邮箱字符
export function regEmail(email) {
  let new_email = ''
  if (String(email).indexOf('@') > 0) {
    const str = email.split('@')
    let _s = ''
    if (str[0].length > 3) {
      for (let i = 0; i < str[0].length - 3; i++) {
        _s += '*'
      }
    }
    new_email = str[0].substr(0, 3) + _s + '@' + str[1]
  }
  return new_email
}

// 替换手机字符
export function regMobile(mobile) {
  let new_mobile = ''
  if (mobile.length > 7) {
    new_mobile = mobile.substr(0, 3) + '****' + mobile.substr(7)
  }
  return new_mobile
}

// 下载文件-已修改
export function downloadFile(obj, name, suffix = '') {
  const url = window.URL.createObjectURL(new Blob([obj]))
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  const fileName = suffix ? name + '.' + suffix : name
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
