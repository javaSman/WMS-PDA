import { formatEbeln, formatProdbatch, formatLgort, formatMaterial } from '@/views/dict'

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
  { label: '采购订单', prop: 'ebeln', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '订单行', prop: 'rspos', type: 'Table/CheckBox' },
  { label: '箱子号', prop: 'boxID', type: 'Table/Input', rules: [{ required: true, message: '请输入/扫码箱子号', trigger: 'onBlur' }] },
  { label: '区域', prop: 'locationID', type: 'Table/Input', rules: [{ required: true, message: '请输入/扫码区域', trigger: 'onBlur' }] },
  { label: 'PO#', prop: 'ebeln', formatter: formatEbeln },
  { label: '生产批/工位', prop: 'prodbatch', formatter: formatProdbatch },
  { label: '工厂库位', prop: 'lgort', formatter: formatLgort },
  { label: '物料编号', prop: 'matnr', formatter: formatMaterial },
  { label: '物料描述', prop: 'txz01', type: 'Table/Notice' },
  { label: '退货原因', prop: 'grtxt', formatter: formatGrtxt },
  { label: '退货数量', prop: 'erfmg' }
]

// 【退货原因】
export function formatGrtxt(data, val) {
  return `${data.grtxt} | ${data.grund}`
}
