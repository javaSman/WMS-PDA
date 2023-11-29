export const formList = [
  { type: 'Input', label: '调拨单', prop: 'IM_BARCODE', rules: [{ required: true, message: '请输入调拨单', trigger: 'onBlur' }] },
  { type: 'Input', label: '条码', prop: 'imBarcode' },
  { type: 'Input', label: '快递单号', prop: 'number' }
]
export const showFormList = [
  { label: '单号', prop: 'reqno', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '单号', prop: 'REQNO', type: 'Table/CheckBox' },
  { label: '行号', prop: 'RSPOS' },
  { label: '快递单号', prop: 'COURIER', type: 'Table/Notice' },
  // { label: '转出箱子', prop: 'boxID', type: 'Table/Input', rules: [{ required: true, message: '请输入转出箱子', trigger: 'onBlur' }] },
  // { label: '转出区域', prop: 'locationID', type: 'Table/Input', rules: [{ required: true, message: '请输入转出区域', trigger: 'onBlur' }] },
  // { label: '调入区域', prop: 'vstel', formatter: formatVstel },
  { label: '批次', prop: 'CHARG' },
  { label: '物料编号', prop: 'IDNRK'},
  { label: '物料描述', prop: 'MAKTX', type: 'Table/Notice' },
  { label: '工位', prop: 'WORKT' },
  { label: '对象编号', prop: 'ZZDOEX' },
  { label: 'WMS区域', prop: 'WMS_AREA' }
]

// 调入区域
export function formatVstel(data, val) {
  return `${data.vstel} | ${data.charg}`
}

// 调出库位werkt - lgott
export function formatWerkt(data, val) {
  return `${data.werkt}-${data.lgott}`
}
