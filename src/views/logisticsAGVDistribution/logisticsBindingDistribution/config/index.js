export const formList = [
  { type: 'Input', label: '储物格', prop: 'drawer', rules: [{ required: true, message: '请输入储物格', trigger: 'onBlur' }] },
  { type: 'Input', label: '机器人', prop: 'agvNo', rules: [{ required: true, message: '请输入机器人', trigger: 'onBlur' }] },
  { type: 'Input', label: '领料单号', prop: 'imBarcode' }
]

export const tableColumn = [
  { label: '储物格', prop: 'drawer'},
  { label: '机器人', prop: 'agvNo' },
  { label: '领料单', prop: 'imBarcode' },
  { label: '目的地', prop: 'destination' },
  { label: '接收人', prop: 'operator' },
  { label: ' ', prop: 'bottom_clean' }
]
