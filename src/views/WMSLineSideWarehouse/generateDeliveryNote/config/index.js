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
    label: '箱子号',
    prop: 'BoxID',
    rules: [{ required: true, message: '请输入箱子号', trigger: 'onBlur' }]
  }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '订单行', prop: 'OrderItemNo', type: 'Table/CheckBox' },
  { label: '条码', prop: 'Barcode' },
  { label: '物料编码', prop: 'MaterialNo' },
  { label: '物料描述', prop: 'MaterialDesc' },
  { label: '数量', prop: 'Qty' }
]
