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
    label: '转出箱子',
    prop: 'outBoxNo'
  },
  {
    type: 'Input',
    label: '接收箱子',
    prop: 'receivingBoxId'
  },
  {
    type: 'Input',
    label: '接收区域',
    prop: 'receivingAreaNo'
  },
  {
    type: 'Text',
    label: '接收仓库',
    prop: 'receivingWarehouseNo'
  },
  {
    type: 'Input',
    label: '条码',
    prop: 'Barcode'
  }
]
export const showFormList = []
export const tableColumn = [
  { label: '条码号', prop: 'barcode', type: 'Table/CheckBox' },
  { label: '物料编号', prop: 'materialNo' },
  { label: '物料描述', prop: 'materialDesc' },
  { label: '领料数量', prop: 'quantity', type: 'Table/NumberInput', multiple: 1 },
  { label: '生产批', prop: 'batch' },
  { label: '工位', prop: 'stationNo' },
  { label: 'ECN号', prop: 'ecnNo' }
]
