import { formatProdbatchBySlash, formatMaterial } from '@/views/dict'

export const formList = [
  {
    type: 'Dropdown',
    label: '仓库',
    prop: 'warehouseNo',
    options: [],
    optProps: { label: 'warehouseNo', value: 'warehouseNo' },
    rules: [{ required: true, message: '请选择仓库', trigger: 'onChange' }]
  },
  { type: 'Input', label: '箱子号', prop: 'wmsTools', rules: [{ required: true, message: '请输入箱子号', trigger: 'onBlur' }] },
  { type: 'Input', label: '区域', prop: 'locationId', rules: [{ required: true, message: '请输入区域', trigger: 'onBlur' }] },
  { type: 'Input', label: '条码', prop: 'imBarcode' }
]
export const showFormList = [
  { label: '送货条码', prop: 'delivnum', type: 'Text' },
  { label: '送货单号', prop: 'sgtxt4', type: 'Text' },
  { label: '供应商', prop: 'lifnr', type: 'Text' },
  { label: '采购订单', prop: 'ebeln', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '条码', prop: 'barcode', type: 'Table/CheckBox' },
  { label: '订单行', prop: 'rspos' },
  { label: '采购订单', prop: 'ebeln' },
  { label: '物料编号', prop: 'matnr', formatter: formatMaterial },
  { label: '物料描述', prop: 'txz01', type: 'Table/Notice' },
  { label: '生产批/工位', prop: 'prodbatch', formatter: formatProdbatchBySlash },
  { label: '不良品数量', prop: 'scrqty' }
]