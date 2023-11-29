export const formList = [
  {
    type: 'Dropdown',
    label: '仓库',
    prop: 'warehouseNo',
    options: [],
    optProps: { label: 'warehouseNo', value: 'warehouseNo' },
    rules: [{ required: true, message: '请选择仓库', trigger: 'onChange' }]
  },
  { type: 'Input', label: '卡板/箱子号', prop: 'wmsTools' },
  { type: 'Input', label: '接收区域', prop: 'receiveArea' },
  { type: 'Text', label: '接收仓库', prop: 'receiveWarehouse' }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '条码', prop: 'barcode', type: 'Table/CheckBox' },
  { label: '物料编号', prop: 'materialNo' },
  { label: '物料描述', prop: 'materialDesc', type: 'Table/Notice' },
  { label: '领料数量', prop: 'quantity' },
  { label: '批次', prop: 'batch' },
  { label: '工位', prop: 'stationNo' },
  { label: 'ECN号', prop: 'x1' } // TODO: 待确认字段
]
