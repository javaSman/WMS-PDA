export const formListQuery = [
  {
    type: 'Input',
    label: '条码',
    prop: 'Barcode'
    // rules: [{ required: true, message: '请扫码或输入条码', trigger: 'onChange' }]
  },
  {
    type: 'Input',
    label: '箱子号',
    prop: 'BoxNoQuery'
    // rules: [{ required: true, message: '请扫码或输入条码', trigger: 'onChange' }]
  }
]
export const formList = [
  { type: 'Text', label: '条码:', prop: 'Barcode' },
  { type: 'Text', label: '箱子号:', prop: 'BoxNo' },
  { type: 'Text', label: '物料号:', prop: 'MaterialNo' },
  { type: 'Text', label: '备料数:', prop: 'PickingQuantity' },
  { type: 'Text', label: '数量:', prop: 'Quantity' }
]
export const showFormList = []
export const tableColumn = [
  { label: '箱子号', prop: 'BoxNo', type: 'Table/CheckBox' },
  { label: '物料号', prop: 'MaterialNo' },
  { label: '数量', prop: 'Quantity' }
]
