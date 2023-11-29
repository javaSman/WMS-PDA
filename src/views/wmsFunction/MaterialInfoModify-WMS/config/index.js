export const formList = [
  // { type: 'Input', label: '物料编号', prop: 'materialNo' },
  { type: 'Input', label: '条码', prop: 'imBarcode' }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '物料编号', prop: 'materialNo', type: 'Table/CheckBox' },
  { label: '物料描述', prop: 'materialDesc', type: 'Table/Notice' },
  {
    label: '容量',
    prop: 'capacity',
    type: 'Table/NumberInput'
  },
  { label: '上立体库', prop: 'cube', type: 'CustomSlot', slot: 'checkbox' },
  {
    label: '库存预警数',
    prop: 'safetyQty',
    type: 'Table/NumberInput'
  },
  {
    label: '单位数量',
    prop: 'unitQty',
    type: 'Table/NumberInput'
  }, // 字段待定
  {
    label: '满载数量',
    prop: 'fullQty',
    type: 'Table/NumberInput'
  }, // 字段待定
  {
    label: '峰值库存',
    prop: 'topQty',
    type: 'Table/NumberInput'
  }
]

// function validatorMessage(val) {
//   if (Number(val) < 0) {
//     return false
//   } else {
//     return true
//   }
// }
