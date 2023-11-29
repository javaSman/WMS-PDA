import deepClone from './deepClone'
/** 验证表格勾选项的必填项是否都有值 */
export function validateTableSelected(tableColumn, selectedList) {
  let flag = true
  let message = ''
  tableColumn.forEach(item => {
    if (item.rules && item.rules.length > 0 && item.rules[0].required) {
      let _target = selectedList.find(_list => !_list[item.prop])
      if (_target) {
        flag = false
        message = '请输入' + item.label
        return
      }
    }
  })
  // console.log(flag)
  return {isPass: flag, message}
}

/**
 * @description 将选中的某项置顶
 * @param originArr 原始数组
 * @param targetItem 目标项
 */
export function checkItemToTop(originArr, targetItem) {
  let _arr = []
  // tips:这个要判断targetItem是数组还是对象,因为有可能寻找出多项的情况
  if (Array.isArray(targetItem)) {
    let _targetItemUUIDS = targetItem.map(item => item.uuid)
    // 过滤掉那些不存在的uuid的项目
    _arr = deepClone(originArr.filter(item => !_targetItemUUIDS.includes(item.uuid)))
  } else {
    // 先排除目标项
    _arr = deepClone(originArr.filter(item => item.uuid !== targetItem.uuid))
    // 然后将目标项从头插入即可实现置顶
  }
  if (Array.isArray(targetItem)) {
    _arr.unshift(...targetItem)
  } else {
    // console.log('此时的_arr', _arr)
    _arr.unshift(targetItem)
  }
  return _arr
}
