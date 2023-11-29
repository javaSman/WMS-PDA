import { formatLgortConnector, formatEbeln, formatMaterial, formatProdbatchBySlash } from '@/views/dict'

export const formList = [
  {
    type: 'Dropdown',
    label: '仓库',
    prop: 'warehouseNo',
    options: [],
    optProps: { label: 'warehouseNo', value: 'warehouseNo' },
    rules: [{ required: true, message: '请选择仓库', trigger: 'onChange' }]
  },
  { type: 'Input', label: '条码', prop: 'imBarcode' }
]
export const showFormList = [
  { label: '退货单号', prop: 'reqno', type: 'Text' },
  { label: '供应商', prop: 'lifnr', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '订单行', prop: 'ebeln', type: 'Table/CheckBox', formatter: formatEbeln },
  { label: '箱子号', prop: 'boxID', type: 'Table/Input', rules: [{ required: true, message: '请输入/扫码箱子号', trigger: 'onBlur' }] },
  { label: '区域', prop: 'locationID', type: 'Table/Input', rules: [{ required: true, message: '请输入/扫码区域', trigger: 'onBlur' }] },
  { label: '条码', prop: 'barcode' },
  { label: '目标库位', prop: 'lgort', formatter: formatLgortConnector },
  { label: '物料编号', prop: 'matnr', formatter: formatMaterial },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '收货数量', prop: 'erfmg', type: 'Table/Number', multiple: 1 },
  { label: '生产批/工位', prop: 'prodbatch', formatter: formatProdbatchBySlash },
  { label: '备注', prop: 'retext' }
]
