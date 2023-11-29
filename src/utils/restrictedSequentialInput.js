import deepClone from './deepClone'
import { v4 as uuidv4 } from 'uuid'
import { _showFailToast } from './message'
/**
 * @description 一个受某一key顺序限制输入的工具函数,该Key对应的value必须能被Number格式化成数字
 * @param key key
 * @param value 当前输入值
 * @param tableData 原本数据源
 */

export function restrictedSequentialInput(key, value, tableData, item) {
  return new Promise(resolve => {
    const result = deepClone(tableData)
    if (result.length > 0) {
    // 获取数组最后一项的key值
      const prevKey = result[result.length - 1][key]
      if (Number(value) - Number(prevKey) === 1) {
        result.push({...item, index: result.length + 1, uuid: uuidv4()})
      } else {
        _showFailToast({message: '请按顺序输入'})
      }
    } else {
      result.push({...item, index: 1})
    }
    resolve(result)
  })
}
