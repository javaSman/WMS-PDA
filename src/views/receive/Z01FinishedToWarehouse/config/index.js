import { formatMaterial } from '@/views/dict'
export const formList = [
  {
    type: 'Input',
    label: '条码',
    prop: 'imBarcode'
    // rules: [{ required: true, message: '请输入条码', trigger: 'onBlur' }]
  },
  {
    type: 'Calendar',
    label: '过账日期',
    prop: 'postDate',
    rules: [{ required: true, message: '请选择过账日期', trigger: 'onChange' }]
  }
]
export const tableColumn = [
  { label: '行号', prop: 'barcode', type: 'Table/CheckBox' },
  { label: '工厂', prop: 'werks' },
  { label: '工单号', prop: 'aufnr' },
  { label: '物料编号', prop: 'matnr', formatter: formatMaterial },
  { label: '物料描述', prop: 'txz01', type: 'Table/Notice' },
  { label: '单位', prop: 'erfme' },
  { label: '收货数量', prop: 'erfmg', type: 'Table/NumberInput' },
  { label: '条码数量', prop: '_erfmg' }
]
