export const formList = [
  {
    type: 'Dropdown',
    label: '仓库',
    prop: 'warehouseNo',
    options: [],
    optProps: { label: 'warehouseNo', value: 'warehouseNo' },
    rules: [{ required: true, message: '请选择仓库', trigger: 'onChange' }]
  },
  { type: 'Input', label: '转出箱子号', prop: 'wmsToolsOut' },
  { type: 'Input', label: '接收箱子号', prop: 'wmsToolsIn' },
  { type: 'Input', label: '验证条码', prop: 'imBarcode' }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '条码', prop: 'barcode', type: 'Table/CheckBox' },
  { label: '物料编号', prop: 'materialNo' },
  { label: '物料描述', prop: 'materialDesc', type: 'Table/Notice' },
  { label: '生产批/工位', prop: 'batch' },
  { label: '数量', prop: 'erfmg'},
  { label: '标签数量', prop: 'quantity' }
]
