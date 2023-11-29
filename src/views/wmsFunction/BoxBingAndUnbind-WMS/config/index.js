export const formList = [
  { type: 'Input', label: '箱子号', prop: 'boxNo', rules: [{ required: true, message: '请输入箱子号', trigger: 'onBlur' }] },
  { type: 'Input', label: '区域', prop: 'locationNo', rules: [{ required: true, message: '请输入区域', trigger: 'onBlur' }] },
  { type: 'Text', label: '总数', prop: 'total' }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]

export const tableColumn = [
  { label: '条码', prop: 'barcode' },
  { label: '物料编号', prop: 'materialNo' },
  { label: '物料描述', prop: 'materialDesc', type: 'Table/Notice' },
  { label: '数量', prop: 'quantity' },
  { label: '生产批', prop: 'batch' },
  { label: '工位', prop: 'stationNo' }
]
