import { formatLgort, formatEbeln, formatMaterial } from '@/views/dict'

export const formList = [
  {
    type: 'Input',
    label: '条码',
    prop: 'imBarcode'
    // rules: [{ required: true, message: '请输入条码', trigger: 'onBlur' }]
  }
]
export const showFormList = [
  { label: '退货单号', prop: 'reqno', type: 'Text' },
  { label: '供应商', prop: 'lifnr', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '订单行', prop: 'ebeln', type: 'Table/CheckBox', formatter: formatEbeln },
  { label: '条码', prop: 'barcode' },
  { label: '目标库位', prop: 'lgort', formatter: formatLgort },
  { label: '物料编号', prop: 'matnr', formatter: formatMaterial, type: 'Table/RightBtn', tableBtnParams: { btnText: '配件清单', loading: [] } },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '收货数量', prop: 'erfmg', type: 'Table/Number', multiple: 1 },
  { label: '生产批/工位', prop: 'prodbatch', formatter: (data, val) => formatCharg(data, val) },
  { label: '备注', prop: 'retext' }
]

// 【生产批/工位】数据格式化：生产批 / 工位
export function formatCharg(data, val) {
  return `${data.prodbatch || 1} / ${data.workp}`
}
