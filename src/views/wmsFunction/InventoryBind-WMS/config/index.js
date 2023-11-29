
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
    prop: 'wmsTools',
    rules: [{ required: true, message: '请输入箱子号', trigger: 'onBlur' }]
  },
  {
    type: 'Input',
    label: '区域',
    prop: 'locationID'
  },
  { type: 'Input', label: '条码', prop: 'imBarcode' }
]

export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]

export const tableColumn = [
  { label: '条码', prop: 'barcode', type: 'Table/CheckBox' },
  { label: '物料编号', prop: 'materialNo', formatter: (data) => data.materialNo.replace(/^0+/gi, '')},
  { label: '物料描述', prop: 'materialDesc', type: 'Table/Notice' },
  { label: '生产批/工位', prop: 'stationNo', formatter: formatChargWMS },
  { label: '项目号', prop: 'projectNo' },
  { label: '在库数量', prop: 'quantity' },
  { label: '标签数量', prop: 'menge' },
  {
    label: '数量',
    prop: 'newQuantity',
    type: 'Table/NumberInput',
    rules: [{ required: true, message: '请输入数量', trigger: 'onBlur' }]
  }
]

/**
 * 格式化生产批/工位
 * @param data 整条数据
 * @returns 生产批 / 工位
 */
export function formatChargWMS(data) {
  if (!data.batch && !data.stationNo) return ''
  return `${data.batch || ''} / ${data.stationNo || ''}`
}
