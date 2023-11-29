export const formList = [
  {
    type: 'Dropdown',
    label: '仓库号',
    prop: 'warehouseNo',
    options: [],
    optProps: { label: 'warehouseNo', value: 'warehouseNo' },
    rules: [{ required: true, message: '请选择仓库', trigger: 'onChange' }]
  },
  {
    type: 'Input',
    label: '箱子号',
    prop: 'BoxNo'
  },
  {
    type: 'Input',
    label: '条码',
    prop: 'Barcode'
  }
]
export const showFormList = []
export const tableColumn = [
  { label: '条码号', prop: 'Barcode', type: 'Table/CheckBox' },
  { label: '物料编号', prop: 'MaterialNo' },
  { label: '物料描述', prop: 'MaterialDesc' },
  { label: '领料数量', prop: 'Quantity' },
  { label: '生产批', prop: 'Batch' },
  { label: '工位', prop: 'StationNo' },
  { label: 'ECN号', prop: 'EcnNo' }
]
