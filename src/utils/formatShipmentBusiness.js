import { postTransferPramamsForWmsInOutStock, postTransferPramamsForWmsInPostIn } from './postTransferPramsForWms'
import dayjs from 'dayjs'
import deepClone from './deepClone'

/**
 * @param imOclas 类型
 * @param account 当前登录人工号
 * @param name 当前登录人姓名
 * @param warehouseNo  仓库编码
 * @param list 选择的数组
 * @param type 过账类型，in是入库,out是出库
 * @param extraParams 额外的授权参数
 * @param TargetWarehouseNo 目标仓库编码
 * @returns
 */
export function fomrmatShipmentSubmitParams(imOclas, account, name, warehouseNo, list, type, extraParams, TargetWarehouseNo, barcodeKey, materialDescKey, postDate) {
  let _list = deepClone(list)
  let _list2 = deepClone(list)
  // tips: 如果有授权信息就混入授权信息
  if (extraParams) {
    _list = _list.map(item => ({...item, ...extraParams}))
    _list2 = _list2.map(item => ({...item, ...extraParams}))
  }
  if (type === 'in') {
    return {
      iM_OCLAS: imOclas,
      IM_CARDNO: account,
      IM_CARDNAME: name,
      warehouseNo: warehouseNo ?? '',
      wmsPostInList: postTransferPramamsForWmsInPostIn(_list, imOclas, barcodeKey, materialDescKey),
      zxstXmbeStruList: _list2.map(item => ({
        ...item,
        IM_CARDNO: account,
        IM_CARDNAME: name,
        cpudt: dayjs(postDate).format('YYYY-MM-DD'),
        cputm: dayjs(postDate).format('HH:mm:ss')
      }))
    }
  } else if (type === 'out') {
    return {
      iM_OCLAS: imOclas,
      iM_CARDNO: account,
      iM_CARDNAME: name,
      WarehouseNo: warehouseNo ?? '',
      TargetWarehouseNo: TargetWarehouseNo,
      wmsOutStockList: postTransferPramamsForWmsInOutStock(_list, imOclas, barcodeKey, materialDescKey),
      zxstXmbeStruList: _list2.map(item => ({
        ...item,
        IM_CARDNO: account,
        IM_CARDNAME: name,
        cpudt: dayjs(postDate).format('YYYY-MM-DD'),
        cputm: dayjs(postDate).format('HH:mm:ss')
      }))
    }
  } else {
    throw new Error('请传入正确的类型in或者out')
  }
}
