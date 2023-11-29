
import { formatErfmg, formatMaterial, formatLgortConnector } from '@/views/dict'
export const formList = [
  { type: 'Input', label: '条码', prop: 'imBarcode' }
]
export const showFormList = [
  { label: '出库单号', prop: 'reqno', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '工厂库位', prop: 'lgort', type: 'Table/CheckBox', formatter: formatLgortConnector },
  { label: '箱子号', prop: 'wmsTools', type: 'Table/Input', rules: [{ required: true, message: '请输入箱子号', trigger: 'onBlur' }] },
  { label: '区域', prop: 'locationId', type: 'Table/Input', rules: [{ required: true, message: '请输入区域', trigger: 'onBlur' }] },
  { label: '物料编号', prop: 'matnr', formatter: formatMaterial },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '销售订单', prop: 'kdauf' },
  { label: '交货单号', prop: 'vbelv', formatter: formatVbelv },
  { label: '出库数量', prop: 'erfmg', formatter: formatErfmg },
  { label: '生产批', prop: 'prodbatch' },
  { label: '批次号码', prop: 'charg' },
  {
    label: '领料人',
    prop: 'operator',
    type: 'Table/RightBtn',
    tableBtnParams: { btnText: '序列号', loading: [], icon: 'scan' }
  }
]

// 【交货单号】数据格式化vbelv posnv
export function formatVbelv(data, val) {
  return `${data.vbelv}-${data.posnv}`
}

export const SNFormList = [{ label: '条码', prop: 'imBarcode', type: 'Input' }]
export const SNTableColumn = [
  { label: '序列号', prop: 'equnr' },
  { label: '项目/生产批', prop: 'proje', formatter: formatterProje },
  { label: '物料编号', prop: 'matnr' }
]

function formatterProje(data) {
  return `${data.proje}/${data.equnr}`
}
