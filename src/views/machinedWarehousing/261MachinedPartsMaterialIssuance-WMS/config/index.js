/*
 * @Description:
 * @Author: ZmSama
 * @Date: 2023-07-08 15:33:16
 */

export const formList = [
  // {
  //   type: 'Dropdown',
  //   label: '仓库',
  //   prop: 'warehouseNo',
  //   options: [],
  //   optProps: { label: 'warehouseNo', value: 'warehouseNo' },
  //   rules: [{ required: true, message: '请选择仓库', trigger: 'onChange' }]
  // },
  { type: 'Input', label: '来源载具', prop: 'boxID', rules: [{ required: true, message: '请输入来源载具', trigger: 'onBlur' }] },
  { type: 'Input', label: '目标载具', prop: 'targetBoxID', rules: [{ required: true, message: '请输入目标载具', trigger: 'onBlur' }] },
  { type: 'Input', label: '目标区域', prop: 'targetLocationID', rules: [{ required: true, message: '请输入目标区域', trigger: 'onBlur' }] },
  { type: 'Input', label: '条码', prop: 'imBarcode' }
]
export const showFormList = [
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '条码', prop: 'barcode', type: 'Table/CheckBox' },
  { label: '物料编号', prop: 'materialNo', formatter: (data) => data.materialNo.replace(/^0+/gi, '') },
  { label: '物料描述', prop: 'materialDesc', type: 'Table/Notice' },
  { label: '项目', prop: 'projectNo' },
  { label: '工位', prop: 'stationNo' },
  { label: '批次', prop: 'batch' },
  { label: '数量', prop: 'quantity' },
  { label: '领料人', prop: 'operator' }
]
