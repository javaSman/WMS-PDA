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
  { type: 'Input', label: '转入箱子', prop: 'targetBoxID', rules: [{ required: true, message: '请输入转入箱子', trigger: 'onBlur' }] },
  { type: 'Input', label: '转入区域', prop: 'targetLocationID', rules: [{ required: true, message: '请输入转入区域', trigger: 'onBlur' }] },
  // { type: 'Input', label: '转出箱子', prop: 'outBoxID' },
  // { type: 'Input', label: '转出区域', prop: 'outLocationID' },
  { type: 'Input', label: '条码', prop: 'imBarcode' }
]
export const showFormList = [
  { label: '单号', prop: 'reqno', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '单号', prop: 'reqno', type: 'Table/CheckBox' },
  { label: '工厂库位', prop: 'lgort', formatter: formatLgortConnector },
  // { label: '转出箱子', prop: 'boxID' },
  // { label: '转出区域', prop: 'locationID' },
  { label: '调入区域', prop: 'wms_area', formatter: formatVstel },
  { label: '生产批', prop: 'prodbatch', formatter: formatProdbatch },
  { label: '条码', prop: 'barcode' },
  { label: '物料编号', prop: 'matnr', type: 'Table/RightBtn', formatter: formatMaterial, tableBtnParams: { btnText: '配件清单', loading: [] } },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '数量', prop: 'erfmg', formatter: formatErfmg },
  { label: '生产订单', prop: 'aufnr', formatter: formatAufnr },
  { label: '调出批次', prop: 'chart' },
  { label: '调出区域', prop: 'wms_area_t' },
  { label: '调出库位', prop: 'werkt', formatter: formatWerkt }
]

// 调入区域
export function formatVstel(data, val) {
  return `${data.wms_area} | ${data.charg}`
}

// 调出库位werkt - lgott
export function formatWerkt(data, val) {
  return `${data.werkt}-${data.lgott}`
}
