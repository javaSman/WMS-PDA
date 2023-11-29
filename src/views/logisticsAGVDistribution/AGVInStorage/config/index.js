export const formList = [
  { type: 'Dropdown', label: '仓库', prop: 'storehouse', options: [], rules: [{ required: true, message: '请选择仓库', trigger: 'onBlur' }] },
  { type: 'Input', label: '箱子号', prop: 'boxId', rules: [{ required: true, message: '请输入箱子号', trigger: 'onBlur' }] },
  { type: 'Input', label: '码头', prop: 'wharf', rules: [{ required: true, message: '请输入码头', trigger: 'onBlur' }] },
  { type: 'Dropdown', label: '目标位置', prop: 'stations', options: [], rules: [{ required: true, message: '请选择目标位置', trigger: 'onBlur' }] }
]
