
import { formatLgortConnector, formatErfmg, formatProdbatch, formatMaterial, formatAufnr } from '@/views/dict'

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
  { type: 'Input', label: '条码', prop: 'imBarcode' },
  { label: '单号', prop: 'reqno', type: 'Text' }
]
export const showFormList = [
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '工厂库位', prop: 'lgort', type: 'Table/CheckBox', formatter: formatLgortConnector },
  // { label: '箱子号', prop: 'boxID' },
  // { label: '区域', prop: 'locationID' },
  { label: '调入区域', prop: 'vstel', formatter: formatVstel },
  { label: '生产批', prop: 'prodbatch', formatter: formatProdbatch },
  { label: '物料编号', prop: 'matnr', type: 'Table/RightBtn', tableBtnParams: { btnText: '配件清单', loading: [] }, formatter: formatMaterial },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '数量', prop: 'erfmg', formatter: formatErfmg },
  { label: '生产订单', prop: 'aufnr', formatter: formatAufnr },
  { label: '调出批次', prop: 'chart' },
  { label: '调出区域', prop: 'lfart' },
  { label: '调出库位', prop: 'werkt', formatter: formatWerkt }
]
// 调入区域
export function formatVstel(data, val) {
  return `${data.vstel} | ${data.charg}`
}

// 调出库位werkt - lgott
export function formatWerkt(data, val) {
  return `${data.werkt}-${data.lgott}`
}
