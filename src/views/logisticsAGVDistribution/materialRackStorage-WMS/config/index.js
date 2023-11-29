export const formList = [
  { type: 'Dropdown', label: '仓库', prop: 'warehouseNo', options: [], rules: [{ required: true, message: '请选择仓库', trigger: 'onBlur' }] },
  { type: 'Input', label: '料架号', prop: 'materialShelfNo', rules: [{ required: true, message: '请输入料架号', trigger: 'onBlur' }] },
  { type: 'Input', label: '所在区域', prop: 'locationNo', disabled: true }
]
