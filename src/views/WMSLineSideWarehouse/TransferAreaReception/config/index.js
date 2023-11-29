export const formList = [
  {
    type: 'Dropdown',
    label: '仓库',
    prop: 'warehouseNo',
    options: [],
    optProps: { label: 'warehouseNo', value: 'warehouseNo' },
    rules: [{ required: true, message: '请选择仓库', trigger: 'onChange' }]
  },
  {
    type: 'Input',
    label: '卡板/箱子号',
    prop: 'wmsTools'
  },
  {
    type: 'Input',
    label: '区域',
    prop: 'locationId'
  }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '卡板编号', prop: 'boxNo', type: 'Table/CheckBox' },
  { label: '物料数量', prop: 'quantity' }
]
