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
    label: '转出箱子号',
    prop: 'wmsTools',
    rules: [{ required: true, message: '请输入箱子号', trigger: 'onBlur' }]
  },
  {
    type: 'Input',
    label: '转入箱子号',
    prop: 'targetBoxID',
    rules: [{ required: true, message: '请输入箱子号', trigger: 'onBlur' }]
  },
  {
    type: 'Input',
    label: '区域',
    prop: 'targetLocationID',
    rules: [{ required: true, message: '请输入区域', trigger: 'onBlur' }]
  }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '条码', prop: 'barcode', type: 'Table/CheckBox' },
  { label: '物料编号', prop: 'materialNo' },
  { label: '物料描述', prop: 'materialDesc', type: 'Table/Notice' },
  { label: '生产批/工位', prop: 'charg', formatter: formatChargWMS },
  { label: '拣货数量', prop: 'quantity' },
  {
    label: '转入条码',
    prop: 'targetBarcode',
    type: 'CustomSlot', slot: 'targetBarcode'
  },
  {
    label: '转入数量',
    prop: 'targetBarcodeQuantity',
    type: 'Table/NumberInput'
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
