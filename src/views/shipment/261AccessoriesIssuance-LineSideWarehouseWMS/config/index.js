import {formatMaterial} from '@/views/dict'
export const partListTableColumn = [
  { label: '产品名', prop: 'productname' },
  { label: '规格/型号', prop: 'specification' },
  { label: '单位', prop: 'unit' },
  { label: '数量', prop: 'quantity' }
]
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
    label: '卡板/箱子号',
    prop: 'wmsTools'
  },
  {
    type: 'Input',
    label: '条码号',
    prop: 'imBarcode'
  }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '条码', prop: 'objnr', type: 'Table/CheckBox' },
  { label: '工厂库位', prop: 'werks' },
  { label: '物料编号', prop: 'matnr', formatter: (data) => formatMaterial(data), type: 'Table/RightBtn', tableBtnParams: { btnText: '配件清单', loading: [] } },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '生产订单', prop: 'aufnr' },
  { label: '领料数量', prop: 'erfmg', formatter: (data, val) => formatErfmg(data, val) },
  { label: '生产批', prop: 'retext' },
  { label: 'ECN号', prop: 'ngeln' },
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
