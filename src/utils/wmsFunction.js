/**
 * 获取过账（退货、出货）的参数
 * getOutStockParams(_list,form.value,{},props.type)
 * @param _list 表格数据
 * @param form 表单数据
 * @param userObj 用户数据
 * @param imOclas 业务类型
 * @returns
 */
const getOutStockParams = (_list, form, userObj, imOclas) => {
  let { warehouseNo, boxID, locationID, targetBoxID, targetLocationID } = form
  let wmsOutStockList = []
  _list.forEach((item) => {
    let obj = {
      boxID: boxID ?? item.boxNo ?? '', // 所属载具 -【表单值/表格值】
      materialID: item.materialNo,
      materialDesc: item.materialDesc,
      quantity: item.newQuantity ?? item.quantity, // 数字类型
      unitID: item.unit,
      projectID: item.projectNo,
      barcode: item.barcode, // 条码
      stationID: item.stationNo,
      batchID: item.batch,
      oclas: item.oclas, // 移到类型
      locationID: locationID ?? item.locationNo ?? '', // 货位 -【表单值/表格值】
      areaId: item.areaNo ?? '',
      whId: warehouseNo ?? item.warehouseNo, // 仓库-【表单值/表格值】
      localType: item.localType,
      targetBoxID: targetBoxID ?? '', // TODO: 目标载具编号 -【表单值】
      targetLocationID: targetLocationID, // TODO: 需确认，目标货位 -【表单值】
      targetBarcode: item.targetBarcode, // 目标条码【表格值】
      targetBarcodeQuantity: item.targetBarcodeQuantity, // 目标条码数量【表格值】
      cardNo: userObj?.account, // 工号
      cardName: userObj?.name, // 姓名
      cardNoNew: userObj?.cardno, // 交接工号
      cardNewName: userObj?.cardname, // 交接姓名
      poid: '', // 采购单号-无数据
      poItemNo: '', // 采购订单行号-无数据
      proofNumber: '', // 物料凭证-无数据
      werks: '', // 工厂-无数据
      ngeln: '' // ECN号-无数据
    }
    wmsOutStockList.push(obj)
  })
  // 删除明细中需要扫码/输入的箱子号和区域
  _list.forEach((item) => {
    delete item.boxID
    delete item.locationID
  })

  let _data = {
    IM_OCLAS: imOclas,
    IM_CARDNO: userObj.account,
    IM_CARDNAME: userObj.name,
    warehouseNo,
    wmsOutStockList,
    targetWarehouseNo: '', // 目标仓库编号, --不是必填
    zxstXmbeStruList: _list
  }

  return _data
}

/**
 * 获取过账（入库）的参数
 * getPostInParams(_list,form.value,{},props.type)
 * @param _list 表格数据
 * @param form 表单数据
 * @param userObj 用户数据
 * @param imOclas 业务类型
 * @returns
 */
const getPostInParams = (_list, form, userObj, imOclas) => {
  let { boxID, locationID, warehouseNo } = form
  let wmsPostInList = []
  _list.forEach((item) => {
    let obj = {
      boxID: boxID,
      materialID: item.materialNo,
      materialDesc: item.materialDesc,
      quantity: item.newQuantity ?? item.quantity, // 数字类型
      barcode: item.barcode,
      oclas: item.oclas, // 移到类型
      stationID: item.stationNo,
      projectID: item.projectNo,
      batchID: item.batch,
      locationID: locationID, // 指定货位
      cardNo: userObj.account, // 工号
      cardName: userObj.name, // 姓名
      mark: '', // 不需要传参
      resultMsg: '', // 不需要传参
      poid: '', // 采购单号-无数据
      poItemNo: '', // 采购订单行号-无数据
      proofNumber: '', // 物料凭证-无数据
      ngeln: '' // ECN号-无数据
    }
    wmsPostInList.push(obj)
  })
  let _data = {
    IM_OCLAS: imOclas,
    IM_CARDNO: userObj.account,
    IM_CARDNAME: userObj.name,
    warehouseNo,
    wmsPostInList,
    zxstXmbeStruList: _list
  }
  return _data
}

/**
 * 获取可编辑项的prop
 * 取出tableColumn中类型是Table/Number的项目的prop，因为这个才是可以编辑的项
 * @param tableColumn:表格项数据
 * getEditableKey(props.tableColumn)
 * @returns
 */
const getEditableKey = (tableColumn) => {
  let tarItem = tableColumn.find((item) => item.type === 'Table/Number' || item.type === 'Table/NumberInput')
  let key = tarItem?.prop || ''
  return key
}

/** 计算勾选的累计数量
 *  @param arr:选择项
 *  @param tableColumn:表格项数据
 */
const computedTotal = (arr, tableColumn, keywords) => {
  let key = keywords ?? getEditableKey(tableColumn)
  // 如果key不存在
  if (!key) return 0
  return arr.reduce((pre, next) => {
    return Number(pre) + Number(next[key])
  }, 0)
}

// /**
//  * 表格选中项-验证-校验必填、校验其他validator
//  * validateTable(props.tableColumn, list.value,selectedList.value)
//  **/
// const validateTable = (tableColumn: any[], list: any[], selectedList: any[]) => {
//   let flag: boolean = false
//   for (let col of tableColumn) {
//     let rules: any[] = col?.rules ?? []
//     if (rules.length > 0) {
//       for (let rule of rules) {
//         if (rule.required) {
//           for (let row of selectedList) {
//             if ((row[col.prop] ?? '') === '') {
//               flag = true
//               break
//             }
//           }
//         }
//         if (rule.validator !== undefined) {
//           for (let row of selectedList) {
//             let idx = list.findIndex((item: any) => row.uuid === item.uuid)
//             numBlurParams = ref<any>({ key: col.prop, index: idx })
//             if (rule.validator(row[col.prop]) !== true) {
//               flag = true
//               break
//             }
//           }
//         }
//       }
//     }
//   }
//   return flag
// }

export { getOutStockParams, getPostInParams, getEditableKey, computedTotal }
