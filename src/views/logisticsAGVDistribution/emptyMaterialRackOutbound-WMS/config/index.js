export const formList = [
  { type: 'Dropdown', label: '仓库', prop: 'warehouseNo', options: [], rules: [{ required: true, message: '请选择仓库', trigger: 'onBlur' }] },
  { type: 'Dropdown', label: '空料架', prop: 'materialShelfNo', options: [], rules: [{ required: true, message: '请选择空料架', trigger: 'onBlur' }] },
  { type: 'Dropdown', label: '站点', prop: 'agvSite', options: [], rules: [{ required: true, message: '请选择站点', trigger: 'onBlur' }] }
]
