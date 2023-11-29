/*
 * @Description:
 * @Author: ZmSama
 * @Date: 2023-07-08 15:32:35
 */
import { formatProdbatch, formatErfmg, formatMaterial, formatLgort, formatAufnr } from '@/views/dict'

export const formList = [
  { type: 'Input', label: '转入箱子', prop: 'targetBoxID', rules: [{ required: true, message: '请输入转入箱子', trigger: 'onBlur' }] },
  { type: 'Input', label: '区域', prop: 'targetLocationID', rules: [{ required: true, message: '请输入区域', trigger: 'onBlur' }] },
  { type: 'Input', label: '转出箱子', prop: 'boxID', rules: [{ required: true, message: '请输入转出箱子', trigger: 'onBlur' }] },
  { type: 'Input', label: '领料单号', prop: 'imBarcode' }
]
export const showFormList = [
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '制单号', prop: 'reqno', type: 'Table/CheckBox' },
  { label: '总单号', prop: 'vgbel'},
  { label: '转入条码', prop: 'objnr' },
  { label: '工厂库位', prop: 'lgort', formatter: formatLgort },
  { label: '物料编号', prop: 'idnrk', formatter: formatMaterial },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '生产订单', prop: 'aufnr', formatter: formatAufnr },
  { label: '领料数量', prop: 'erfmg', formatter: formatErfmg },
  { label: '生产批', prop: 'prodbatch', formatter: formatProdbatch },
  { label: 'ECN号', prop: 'ngeln' }
]
