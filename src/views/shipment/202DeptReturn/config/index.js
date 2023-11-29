import { formatLgort, formatMaterial } from '@/views/dict'
export const formList = [
  {
    type: 'Input',
    label: '退料单号',
    prop: 'imBarcode'
  }
]
export const showFormList = [
  { label: '卡板/箱子号', prop: 'delivnum', type: 'Text' },
  { label: '退料单号', prop: 'reqno', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '工厂库位', prop: 'werks', formatter: (data, val) => formatLgort(data, val), type: 'Table/CheckBox' },
  { label: '成本中心', prop: 'kostl', formatter: (data, val) => formatWorkCenter(data, val) },
  { label: '物料编号', prop: 'matnr', type: 'Table/RightBtn', tableBtnParams: { btnText: '配件清单', loading: [] }, formatter: (data) => formatMaterial(data)},
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '领料数量', prop: 'erfmg'},
  { label: '批次号', prop: 'charg' },
  { label: '领料人', prop: 'operator' },
  { label: '备注', prop: 'retext' }
]

//  【成本中心】数据格式化
export function formatWorkCenter(data, val) {
  return `${data.kostl} | ${data.ktext}`
}
// 【生产批次/工位】数据格式化：生产批次 / 工位
export function formatCharg(data, val) {
  return `${data.charg} / ${data.workp}`
}
// 【收货数量】数据格式化：收货数量 * 1 = 收货数量
export function formatErfmg(data, val) {
  return `${val}  × 1 = ${Number(val)} | ${data.erfme}`
}
