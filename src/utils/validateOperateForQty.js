import deepClone from './deepClone'
import { _showFailToast } from './message'

/**
 * @description 用于处理和校验有关的方法
 */

/** 根据tablecolumn判断数量字段，默认值是erfmg*/
const getEditableKey = (tableColumn) => {
  if (tableColumn) {
    let tarItem = tableColumn.find((item) => item.type === 'Table/Number')
    let tar_erfmg = tableColumn.find((item) => item.prop === 'erfmg') // 数量
    let tar_menge = tableColumn.find((item) => item.prop === 'menge') // 数量
    let tar_scrqty = tableColumn.find((item) => item.prop === 'scrqty') // 数量
    let tar_tcqty = tableColumn.find((item) => item.prop === 'tcqty') // 数量
    let tar_qcqty = tableColumn.find((item) => item.prop === 'qcqty') // 数量
    let key =
      tarItem?.prop || tar_erfmg?.prop || tar_menge?.prop || tar_scrqty?.prop || tar_qcqty?.prop || tar_tcqty?.prop || ''
    return key
  } else {
    return 'erfmg'
  }
}

/** 计算勾选内容的数量总数，针对qcqty和tcqty做特殊处理，谁有值就会取谁的值 */
const computedTotal = (arr, computedKey) => {
  let _arr = JSON.parse(JSON.stringify(arr))
  // tips: 如果外部传入了computedKey，则使用这个特殊的key
  let key = computedKey ?? getEditableKey()
  // 如果key不存在
  if (!key) return 0
  // tips: 如果是qcqty和tcqty要特殊处理
  let total = _arr
    .map((item) => item[key])
    .reduce((pre, next) => {
      return Number(pre) + Number(next)
    }, 0)
  if (key === 'qcqty') {
    if (total <= 0) {
      total = _arr.map(item => item['tcqty']).reduce((pre, next) => {
        return Number(pre) + Number(next)
      }, 0)
    }
  } else if (key === 'tcqty') {
    if (total <= 0) {
      total = _arr.map(item => item['qcqty']).reduce((pre, next) => {
        return Number(pre) + Number(next)
      }, 0)
    }
  }
  return total
}

/** 根据传入的数组和其对应的key校验这一项是否大于0 */
const validateQtyForItem = (selectedList, key) => {
  let arr = deepClone(selectedList)
  return new Promise((resolve, reject) => {
    // tips: 这里要特殊处理一下qcqty和tcqty的情况,是哪个有值取哪个
    if (key === 'tcqty') {
      let isTcqty = arr.every((item) => Number(item[key]) > 0)
      if (!isTcqty) {
        let isQcqty = arr.every((item) => {
          let qty = item.qcqty
          return Number(qty) > 0
        })
        if (!isQcqty) {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
          reject(false)
        } else {
          resolve(true)
        }
      } else {
        resolve(true)
      }
    } else if (key === 'qcqty') {
      let isQcqty = arr.every((item) => Number(item[key]) > 0)
      if (!isQcqty) {
        let isTcqty = arr.every((item) => {
          let qty = item.tcqty
          console.log('格式化的 qcqty', Number(qty))
          return parseInt(qty) > 0
        })
        if (!isTcqty) {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
          reject(false)
        } else {
          resolve(true)
        }
      } else {
        resolve(true)
      }
    } else {
      if (key && !arr.every((item) => Number(item[key]) > 0)) {
        _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
        reject(false)
      }
      resolve(true)
    }
  })
}

/** 校验当前所填数量是否超过了原本数量的限制 */
const validateOriginQtyLimit = (originArr, currArr, key, limitKey) => {
  // tips:以originArr为参考，两份数组排序一下，因为扫码置顶扫做会打乱这个顺序
  let _currArr = []
  originArr.forEach(item => {
    currArr.forEach(item2 => {
      if (item.uuid === item2.uuid) {
        _currArr.push(item2)
      }
    })
  })
  return new Promise((resolve, reject) => {
    for (let index = 0; index < _currArr.length; index++) {
      // 去原数组中寻找那一项
      let target = originArr.find(item => item.uuid === _currArr[index].uuid)
      if (_currArr[index][key] > target[limitKey]) {
        _showFailToast('当前的输入数量大于原本数量')
        reject(false)
        return
      }
    }
    resolve(true)
  })
}

/** 校验是否有授权和已经选择了内容 */
const validateAuthAndSelected = (extraParams, selection) => {
  return new Promise((resolve, reject) => {
    if (extraParams) {
      if (selection.length > 0) {
        resolve(true)
      } else {
        _showFailToast({
          message: '请勾选过账内容'
        })
        reject(false)
      }
    } else {
      _showFailToast({
        message: '授权信息为空，请重新登陆'
      })
      reject(false)
    }
  })
}

export {computedTotal, getEditableKey, validateQtyForItem, validateAuthAndSelected, validateOriginQtyLimit}
