export const formList = [
  { type: 'Dropdown', label: '仓库', prop: 'warehouseNo', options: [], rules: [{ required: true, message: '请选择仓库', trigger: 'onBlur' }] },
  { type: 'Dropdown', label: '选择站点', prop: 'siteNos', options: [], rules: [{ required: true, message: '请选择站点', trigger: 'onBlur' }] },
  { type: 'Input', label: '项目', prop: 'projectNo', rules: [{ required: true, message: '请输入项目', trigger: 'onBlur' }] },
  { type: 'Dropdown', label: '批次', prop: 'batchNo', options: [], rules: [{ required: true, message: '请选择批次', trigger: 'onBlur' }] },
  { type: 'Dropdown', label: '工位', prop: 'stationNo', options: [], rules: [{ required: true, message: '请选择工位', trigger: 'onBlur' }] }
]
export const showFormList = [
  { label: '送货条码', prop: 'delivnum', type: 'Text' },
  { label: '送货单号', prop: 'sgtxt4', type: 'Text' },
  { label: '供应商', prop: 'lifnr', type: 'Text' },
  { label: '采购订单', prop: 'ebeln', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '箱子号', prop: 'boxId', type: 'Table/RadioBox' }
  // { label: '采购订单', prop: 'ebeln' },
  // { label: '物料编号', prop: 'matnr' },
  // { label: '物料描述', prop: 'txz01', type: 'Table/Notice' },
  // { label: '生产批/工位', prop: 'prodbatch', formatter: formatProdbatch },
  // { label: '不良品数量', prop: 'scrqty' }
]
