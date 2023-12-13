export const formList = [{ type: 'Input', label: '条码', prop: 'ImBarcode', rules: [{ required: true, message: '请输入条码', trigger: 'onBlur' }] }]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '条码', prop: 'barcode', type: 'Table/CheckBox' },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '工位', prop: 'workp' },
  { label: '批次', prop: 'prodbatch' },
  { label: '数量', prop: 'erfmg' }
]
