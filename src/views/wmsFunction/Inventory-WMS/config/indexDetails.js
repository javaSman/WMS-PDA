export const formList = [
  { type: 'Text', label: '盘点单号', prop: 'inventoryID' },
  { type: 'Input', label: '箱子号', prop: 'boxNo'}
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '箱子号', prop: 'boxNo', type: 'Table/CheckBox' },
  { label: '货位', prop: 'locationNo' },
  { label: '物料编号', prop: 'materialNo' },
  { label: '物料描述', prop: 'materialDesc', type: 'Table/Notice' },
  { label: '数量', prop: 'quantity', type: 'Table/NumberInput', rules: [{ required: true, message: '请输入数量', trigger: 'onBlur' }, { validator: validateQty, message: '数量不能小于等于0'}] }
]

/**
 * 格式化生产批/工位
 * @param data 整条数据
 * @returns 生产批 / 工位
 */
export function formatChargWMS(data) {
  if (!data.batch && !data.stationNo) return ''
  return `${data.batch || ''} / ${data.stationNo || ''}`
}

export function validateQty(val) {
  if (Number(val) <= 0) {
    return false
  } else {
    return true
  }
}
