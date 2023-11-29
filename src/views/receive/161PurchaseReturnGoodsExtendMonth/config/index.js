import { formatLgort, formatProdbatch, formatMaterial } from '@/views/dict'

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
  { label: '采购订单', prop: 'ebeln', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '订单行', prop: 'rspos', type: 'Table/CheckBox' },
  { label: '工厂库位', prop: 'lgort', formatter: formatLgort },
  { label: '物料编号', prop: 'matnr', formatter: (data) => formatMaterial(data) },
  { label: '物料描述', prop: 'txz01', type: 'Table/Notice' },
  { label: '退货数量', prop: 'erfmg' },
  { label: '生产批/工位', prop: 'prodbatch', formatter: formatProdbatch },
  { label: 'ECN号', prop: 'zzngeln' }
]
