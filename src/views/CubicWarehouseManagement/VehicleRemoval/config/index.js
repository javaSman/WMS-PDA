export const formList = [
  {
    type: 'Dropdown',
    label: '仓库',
    prop: 'warehouseNo',
    options: [],
    optProps: { label: 'warehouseName', value: 'warehouseNo' },
    rules: [{ required: true, message: '请选择仓库', trigger: 'onChange' }]
  },
  {
    type: 'Dropdown',
    label: '码头',
    prop: 'wharfNo',
    options: [],
    optProps: { label: 'WharfName', value: 'WharfID' }
  },
  {
    type: 'Input',
    label: '条码/物料号',
    prop: 'imBarcode'
  }
]
export const showFormList = []
export const tableColumn = [
  { label: '物料编号', prop: 'materialNo', type: 'Table/CheckBox' },
  { label: '物料描述', prop: 'materialDesc', type: 'Table/Notice' },
  { label: '当前库存', prop: 'quantity' },
  { label: '箱号', prop: 'boxNo' },
  { label: '装载状态', prop: 'status' }
]
