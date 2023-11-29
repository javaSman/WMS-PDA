
import { formatEbeln, formatMaterial } from '@/views/dict'

export const formList = [
  {
    type: 'Input',
    label: '条码',
    prop: 'imBarcode'
    // rules: [{ required: true, message: '请输入条码', trigger: 'onBlur' }]
  }
]
export const showFormList = [
  { label: '送货单号', prop: 'reqno', type: 'Text' },
  { label: '供应商', prop: 'lifnr', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '采购订单', prop: 'ebeln', formatter: formatEbeln, type: 'Table/CheckBox' },
  {
    label: '工厂库位',
    prop: '_werks',
    type: 'Table/Input',
    rules: [
      { required: true, message: '请输入工厂库位', trigger: 'onBlur' },
      { validator: validatorWerks, message: '请输入正确的工厂库位，用"-"链接' }
    ]
  },
  {
    label: '物料编号',
    prop: 'matnr',
    type: 'Table/RightBtn',
    formatter: formatMaterial,
    tableBtnParams: { btnText: '配件清单', loading: [] }
  },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  {
    label: '收货数量',
    prop: 'erfmg',
    type: 'Table/NumberInput',
    tableNumberParams: { exProp: 'erfme' },
    rules: [{ required: true, message: '请输入收货数量', trigger: 'onBlur' }]
  }
]

// 不匹配：val不存在，或存在但不包含-，或存在但包含不止一个-
export function validatorWerks(val) {
  if (!val) return false
  let x = val.match(/-/g) // 若x为null表示不包含-
  if (!(x && x.length === 1)) return false
  else return true
}
