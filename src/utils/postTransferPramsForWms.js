import deepClone from './deepClone'

import store from '../store'

let { account, name } = store.getters

// let name = store.name
/** 转换过账参数,postIn形式的 */
function postTransferPramamsForWmsInPostIn(oringinList, type, barcodeKey, materialDescKey, quantityKey) {
  let _oringinList = deepClone(oringinList)
  return _oringinList.map((item) => {
    return {
      boxID: item.wmsTools || item.boxID,
      materialID: item.matnr || item.idnrk || item.materialNo || '',
      materialDesc: materialDescKey ? item[materialDescKey] : item.txz01,
      quantity: quantityKey ? judgeQty(item[quantityKey]) : judgeQty(item.erfmg) || judgeQty(item.quantity) || judgeQty(item.scrqty), // 数字类型
      barcode: barcodeKey ? item[barcodeKey] : item.barcode || item.objnr, // 看谁有值就取谁
      oclas: type, // 与查询明细的imOclas参数保持一致
      projectID: judegeProjectID(item.proje, item.projectNo, item.prodbatch, item.batch), // 项目号
      batchID: item.prodbatch || item.batch, // 生产批
      mark: '', // 不需要传参
      resultMsg: '', // 不需要传参
      locationID: item.locationId || item.locationID,
      cardNo: account,
      cardName: name,
      poid: item.ebeln,
      poItemNo: item.ebelp,
      proofNumber: item.mblnr,
      ngeln: item.ngeln,
      stationID: item.workp || item.stationNo || '', // 项目工位,
      unitID: item.erfme ? item.erfme : item.meins,
      cardNewName: item.cardname,
      cardNoNew: item.cardno,
      TargetBarcode: item.TargetBarcode,
      TargetBarcodeQuantity: item.TargetBarcodeQuantity
    }
  })
}
/** 转换过账参数,outStock形式的 */
function postTransferPramamsForWmsInOutStock(oringinList, type, barcodeKey, materialDescKey, quantityKey) {
  let _oringinList = deepClone(oringinList)
  return _oringinList.map((item) => {
    return {
      boxID: item.wmsTools || item.boxID,
      materialID: item.matnr || item.idnrk || item.materialNo || '',
      materialDesc: materialDescKey ? item[materialDescKey] : item.txz01,
      quantity: quantityKey ? judgeQty(item[quantityKey]) : judgeQty(item.erfmg) || judgeQty(item.quantity) || judgeQty(item.scrqty), // 数字类型
      projectID: judegeProjectID(item.proje, item.projectNo, item.prodbatch, item.batch), // 项目号
      barcode: barcodeKey ? item[barcodeKey] : item.barcode || item.objnr,
      batchID: item.prodbatch || item.batch, // 生产批
      oclas: type, // 与查询明细的imOclas参数保持一致
      locationID: item.locationId || '', // 仓位，也叫储位编号
      areaId: item.areaId, // 厂区编号
      whId: item.warehouseNo, // 仓库编号
      cardNo: account,
      cardName: name,
      poid: item.ebeln,
      poItemNo: item.ebelp,
      proofNumber: item.mblnr,
      werks: item.werks, // 工厂
      ngeln: item.ngeln,
      targetBoxID: item.targetBoxID,
      targetLocationID: item.targetLocationID,
      stationID: item.workp || item.stationNo || '', // 项目工位
      unitID: item.erfme ? item.erfme : item.meins,
      cardNewName: item.cardname,
      cardNoNew: item.cardno,
      TargetBarcode: item.TargetBarcode,
      TargetBarcodeQuantity: item.TargetBarcodeQuantity
    }
  })
}

function judegeProjectID(proje, projectNo, prodbatch, batch) {
  let result = proje || projectNo
  let _batch = prodbatch || batch
  if (result) {
    return result
  } else {
    if (_batch) {
      result = _batch.split('-')[0]
      return result
    }
  }
}

export function judgeQty(val) {
  if (isNaN(Number(val))) {
    return 0
  } else {
    return Number(val)
  }
}

// TODO 考虑统一封装这个转换方法

export { postTransferPramamsForWmsInPostIn, postTransferPramamsForWmsInOutStock }
