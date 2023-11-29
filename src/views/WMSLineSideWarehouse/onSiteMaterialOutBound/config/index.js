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
    label: '条码号',
    prop: 'imBarcode'
  }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '行号', prop: 'index', type: 'Table/CheckBox' },
  { label: '条码', prop: 'barcode' },
  { label: '物料编号', prop: 'materialNo', formatter: (data) => data.materialNo.replace(/^0+/gi, '') },
  { label: '物料描述', prop: 'materialDesc', type: 'Table/Notice' },
  { label: '生产批/工位', prop: 'productBatch' },
  { label: '数量', prop: 'quantity', type: 'Table/Number', multiple: 1 },
  { label: '标签数量', prop: 'menge' }
]
