export const formList = [
  {
    type: 'Dropdown',
    label: '仓库',
    prop: 'warehouseNo',
    options: [],
    optProps: { label: 'warehouseNo', value: 'warehouseNo' },
    rules: [{ required: true, message: '请选择仓库', trigger: 'onChange' }]
  },
  { type: 'Input', label: '箱子', prop: 'wmsTools' },
  { type: 'Input', label: '区域', prop: 'locationId' }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '物料编号', prop: 'materialNo', type: 'Table/CheckBox' },
  { label: '物料描述', prop: 'materialDesc', type: 'Table/Notice' },
  { label: '当前库存', prop: 'quantity' },
  { label: '调整数量', prop: 'newQuantity', type: 'CustomSlot', slot: 'newQuantity' }
]
