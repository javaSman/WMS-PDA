export const formList = [
  { type: 'Dropdown', label: '仓库', prop: 'warehouseNo', options: [], rules: [{ required: true, message: '请选择仓库', trigger: 'onBlur' }] },
  { type: 'Dropdown', label: '站点', prop: 'agvSite', options: [], rules: [{ required: true, message: '请选择站点', trigger: 'onBlur' }] },
  { type: 'Input', label: '项目号', prop: 'projectNo', rules: [{ required: true, message: '请输入项目号', trigger: 'onBlur' }] },
  { type: 'Dropdown', label: '批次', prop: 'batchNo', options: [], rules: [{ required: true, message: '请选择批次', trigger: 'onBlur' }] },
  { type: 'Dropdown', label: '工位号', prop: 'stationNo', options: [], rules: [{ required: true, message: '请选择工位号', trigger: 'onBlur' }] }
]

export const tableColumn = [
  { label: '料架号', prop: 'materialShelfNo', type: 'Table/RadioBox' },
  { label: '箱子号', prop: 'boxId' },
  { label: '料架状态', prop: 'materialShelfStatus' }
]
