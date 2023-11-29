export const formList = [
  {
    type: 'Input',
    label: '转运卡',
    prop: 'transferCard',
    rules: [{ required: true, message: '请扫码或输入转运卡', trigger: 'onChange' }]

  },
  {
    type: 'Input',
    label: '待转运区编号',
    prop: 'sourceArea',
    rules: [{ required: true, message: '请扫码或输入待转运区编号', trigger: 'onChange' }]
  },
  {
    type: 'Input',
    label: '卡板编号',
    prop: 'boxNo'
  }
]
export const showFormList = []
export const tableColumn = [{ label: '卡板码', prop: 'locationId', type: 'Table/CheckBox' }]
