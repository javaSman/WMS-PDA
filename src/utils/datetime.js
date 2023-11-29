/* eslint-disable */

/**
 * Date对象的补充函数，包括类似Python中的strftime()
 * 阿债 https://gitee.com/azhai/datetime.js
 */
const local_labels = {
  monthes: {
    english: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  },
  weekdays: {
    english: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    zh: ['日', '一', '二', '三', '四', '五', '六']
  },
  meridians: {
    english: ['a.m.', 'p.m.'],
    en: ['AM', 'PM'],
    zh: ['上午', '下午']
  },
  dayagos: {
    english: ['Today', 'Yesterday', 'Tomorrow', ' days ago', ' days late'],
    en: ['Today', 'Yesterday', 'Tomorrow', ' days ago', ' days late'],
    zh: ['今天', '昨天', '明天', '天前', '天后']
  }
}

class Dates extends Date {
  // datax 为传入的当前时间，可能是 new Date()，也可能是 [2022, 12, 9] 等数组
  constructor(...datex) {
    super(datex)
  }
  /**
   * 返回入参的午夜时间
   * @param date 需要重置的时间，默认为初始化类时传入的时间
   * @returns
   */
  toMidnight(date) {
    date.setHours(0)
    date.setMinutes(0)
    date.setSeconds(0)
    date.setMilliseconds(0)
    return this.strftime('YYYY-MM-DD HH:mm:ss', date)
  }
  /**
   * 返回多少天以前
   * @param days 回到多少天前的天数
   * @param midnight 默认为false，如果为true，则返回多少天前的午夜时间
   * @returns 一个时间
   */
  daysAgo(days, midnight) {
    days = days ? days - 0 : 0
    const date = new Date(this.getTime() - days * 8.64e7)
    return midnight ? this.toMidnight(date) : this.strftime('YYYY-MM-DD HH:mm:ss', date)
  }
  /**
   * 返回一个月的开始时间
   * @param offset TODO: 不知道干嘛的。。
   * @returns 一个月的开始
   */
  monthBegin(offset) {
    offset = offset ? offset - 0 : 0
    const days = this.getDate() - 1 - offset
    return this.daysAgo(days, true)
  }
  /**
   * 获取所传当前时间的季度开始时间
   * @returns 一个季度的开始时间
   */
  quarterBegin() {
    const month = this.getMonth() - (this.getMonth() % 3) + 1
    return new Dates(this.getFullYear(), month, 1)
  }
  /**
   * 获取所传时间的年开始时间
   * @returns 一年的开始时间
   */
  yearBegin() {
    return new Date(this.getFullYear(), 0, 1)
  }
  /**
   * 格式化时间
   * @param format 时间格式 YYYY-MM-DD HH:mm:ss
   * @param date 需要转化的时间
   */
  strftime(format, date) {
    let _val = date ? new Date(date) : this
    let ret
    const opt = {
      'Y+': _val.getFullYear() + '', // 年
      'M+': _val.getMonth() + 1 + '', // 月
      'D+': _val.getDate() + '', // 日
      'H+': _val.getHours() + '', // 时
      'm+': _val.getMinutes() + '', // 分
      's+': _val.getSeconds() + '' // 秒
    }
    for (let k in opt) {
      ret = new RegExp('(' + k + ')').exec(format)
      if (ret) {
        format = format.replace(ret[1], ret[1].length === 1 ? opt[k] : opt[k].padStart(ret[1].length, '0'))
      }
    }
    return format
  }
  /**
   * 根据给定秒数返回指定格式
   * @param value 秒数
   * @returns 00时 00分 00秒
   */
  getTextHMSBySecond(value) {
    let theTime = value // 秒
    let theTime1 = 0 // 分
    let theTime2 = 0 // 小时
    if (theTime > 60) {
      theTime1 = theTime / 60
      theTime = theTime % 60
      if (theTime1 > 60) {
        theTime2 = theTime1 / 60
        theTime1 = theTime1 % 60
      }
    }
    let s = parseInt(theTime + '')
    let result = (s + '').padStart(2, '0') + '秒'
    let m = parseInt(theTime1 + '')
    result = (m + '').padStart(2, '0') + '分 ' + result

    let h = parseInt(theTime2 + '')
    result = (h + '').padStart(2, '0') + '时 ' + result
    return result
  }
  /**
   * 获取给定时间所在年的所在周数
   * @param date 给定时间，默认为初始化类的时候传入的时间
   * @returns 给定时间所在年的所在周数
   */
  getWeek(date) {
    let d1 = new Date(date)
    let d2 = new Date(date)
    d2.setMonth(0)
    d2.setDate(2) // 2表示周一为本周第一天；1表示周日为本周第一天
    let rq = d1.getTime() - d2.getTime()
    let days = Math.ceil(rq / (24 * 60 * 60 * 1000))
    let num = Math.ceil(days / 7)
    return Number(num + 1)
  }
  /**
   * 获取给定时间的所在周的起始时间
   * @param date 给定时间，默认为初始化类的时候传入的时间
   * @returns [start, end]，格式为'YYYY-MM-DD'
   */
  getWeekDay(date) {
    let d = 24 * 3600 * 1000
    let w = new Date(date).getDay()
    let t = new Date(date).getTime()
    let start= null
    let end = null
    // 假如设置星期一为每周的第一天
    // 如果当前是星期天，则往前推6天
    // 如果当前不是星期天，则往前推 （w - 1） * d 天为星期一，往后推 (7 - w) * d天为星期天
    if (w === 0) {
      start = new Date(t - 6 * d)
      end = new Date(t)
    } else {
      start = new Date(t - (w - 1) * d)
      end = new Date(t + (7 - w) * d)
    }
    return [this.strftime('YYYY-MM-DD', start), this.strftime('YYYY-MM-DD', end)]
  }
  /**
   * 获取两个时间差天数
   * @param {any} startTime 开始时间
   * @param {any} endTime 结束时间
   * @returns {number} 返回天数差：number
   */
  getDayNum(startTime, endTime) {
    const stTime = Date.parse(new Date(startTime).toString())
    const etTime = Date.parse(new Date(endTime).toString())
    const usedTime = etTime - stTime
    const days = Math.floor(usedTime / (24 * 3600 * 1000))
    return days
  }
}

export default Dates
