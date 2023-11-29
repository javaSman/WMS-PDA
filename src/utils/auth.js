
/**
 * 本地存储封装模块localStorage
 */
export const getItem = (name) => {
  const time = new Date().getTime()
  const data = window.localStorage.getItem(name)
  // 为什么把 JSON.parse 放到 try-catch 中？
  // 因为 data 可能不是 JSON 格式字符串
  try {
    if (data) {
      if (time < JSON.parse(data).expire) {
        return JSON.parse(data)[name]
      } else {
        removeItem(name)
        return null
      }
    }
  } catch (err) {
    // data 不是 JSON 格式字符串，直接原样返回
    return data
  }
}

export const setItem = (name, value, expire = 1) => {
  // 60分钟*60秒*1000 = 1小时毫秒值
  let time = new Date().getTime() + expire * 24 * 60 * 60 * 1000
  // let time = new Date().getTime() + expire * 1000 * 5
  // let time = new Date().getTime() + expire * 10 * 1000
  // let time = new Date().getTime() + 10 * 1000
  // 如果 value 是对象，就把 value 转为 JSON 格式字符串再存储
  // 设置一个过期时间，默认一天
  // if (typeof value === 'object') {
    value = JSON.stringify({
      [name]: value,
      expire: time
    })
  // }
  window.localStorage.setItem(name, value)
  // window.sessionStorage.setItem(name, value)
}

export const removeItem = (name) => {
  // window.sessionStorage.removeItem(name)
  window.localStorage.removeItem(name)
}

// KeyId
export function getKeyId(name) {
  // return Cookies.get(TokenWMSKey)
  // const data = window.sessionStorage.getItem(name)
  const data = window.localStorage.getItem(name)
  // 为什么把 JSON.parse 放到 try-catch 中？
  // 因为 data 可能不是 JSON 格式字符串
  try {
    // 尝试把 data 转为 JavaScript 对象
    return JSON.parse(data)
  } catch (err) {
    // data 不是 JSON 格式字符串，直接原样返回
    return data
  }
}

export function setKeyId(name, value) {
  // 如果 value 是对象，就把 value 转为 JSON 格式字符串再存储
  if (typeof value === 'object') {
    value = JSON.stringify(value)
  }
  window.localStorage.setItem(name, value)
  // window.sessionStorage.setItem(name, value)
}

/**
 * 本地存储封装模块localStorage
 */
export const getItemLocalS = (name) => {
  const data = localStorage.getItem(name)
  try {
    // 尝试把 data 转为 JavaScript 对象
    return JSON.parse(data)
  } catch (err) {
    // data 不是 JSON 格式字符串，直接原样返回
    return data
  }
}

export const setItemLocalS = (name, value) => {
  // 如果 value 是对象，就把 value 转为 JSON 格式字符串再存储
  if (typeof value === 'object') {
    value = JSON.stringify(value)
  }
  localStorage.setItem(name, value)
}

export const removeItemLocalS = (name) => {
  localStorage.removeItem(name)
}
