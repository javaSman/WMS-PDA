import { formatMaterial } from '@/views/dict'
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
    type: 'Dropdown',
    label: '厂区',
    prop: 'areaId',
    options: [
    ],
    rules: [{ required: true, message: '请选择厂区', trigger: 'onChange' }]
  },
  {
    type: 'Text',
    label: '工厂',
    prop: 'werks'
  },
  {
    type: 'Text',
    label: '仓位',
    prop: 'lgort'
  },
  {
    type: 'Input',
    label: '箱子号',
    prop: 'wmsTools'
  },
  {
    type: 'Input',
    label: '条码',
    prop: 'imBarcode'
  }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '条码', prop: 'objnr', type: 'Table/CheckBox' },
  { label: '物料编号', prop: 'matnr', formatter: (data) => formatMaterial(data)},
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '库存数量', prop: 'menge' },
  { label: '发料数量', prop: 'erfmg', type: 'Table/Number', multiple: 1 },
  { label: '领料人', prop: 'operator' }
]

//  【成本中心】数据格式化
export function formatWorkCenter(data, val) {
  return `${data.kostl} | ${data.ktext}`
}

// 【目标库位】数据格式化：工厂 | 库位
export function formatLgort(data, val) {
  return `${data.werks} | ${data.lgort}`
}
// 【生产批次/工位】数据格式化：生产批次 / 工位
export function formatCharg(data, val) {
  return `${data.charg} / ${data.workp}`
}
// 【收货数量】数据格式化：收货数量 * 1 = 收货数量
export function formatErfmg(data, val) {
  return `${val}  × 1 = ${Number(val)}`
}
