import Vue from 'vue'
import Router from 'vue-router'

import Layout from '@/layout'
import Redirect from '@/layout/redirect'

Vue.use(Router)

/* Router Modules */

// // 加载...
// import { Toast } from 'vant'
// let spinRoute = {
//   show() { // 加载中显示loading组件
//     Toast.loading({
//       position: 'middle',
//       forbidClick: true,
//       message: '加载中...'
//     })
//   },
//   resolve(resolve) { // 加载完成隐藏loading组件
//     return component => {
//       setTimeout(() => {
//         Toast.clear()// 关闭loading组件
//         resolve(component)
//       }, 10)
//     }
//   }
// }

/**
 * hidden: true                   如果设置为true，则item将不会显示在侧边栏中(默认为false)
 * alwaysShow: true               如果设置为true，将始终显示根菜单
 *                                如果没有设置alwaysShow，当item有多个子route时，
 *                                它将变成嵌套模式，否则不会显示根菜单
 * redirect: noRedirect           如果设置noRedirect将不会在面包屑中重定向
 * name:'router-name'             the name is used by <keep-alive> (必须设置)
 * meta : {
    roles: ['admin','editor']    控制页面角色(您可以设置多个角色)
    title: 'title'               名称显示在侧边栏和面包屑 (recommend set)
    icon: 'svg-name'             图标显示在侧边栏
    noCache: true                如果设置为true，页面将不会被缓存(默认为false)
    affix: true                  如果设置为true，标签将被添加到标签视图中
    breadcrumb: false            如果设置为false，该项目将隐藏在breadcrumb中(默认为true)
    activeMenu: '/example/list'  如果设置路径，工具条将突出显示您设置的路径
  }
 */

/**
 * 常规路由-不受权限控制的路由
 * 所有权限通用路由表,代表那些不需要动态判断权限的路由，
 * 如首页和登录页和一些不用权限的公用页面
 */
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    // 当设置 true 的时候该路由不会在侧边栏出现 如401，login等页面，或者如一些编辑页面/edit/1
    hidden: true,
    children: [
      {
        // 在router路由表中定义一个空白路由，强制刷新当前页所用的中间跳转页
        path: '/redirect/:path*',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  // 登录
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  // 主页
  {
    path: '/',
    component: Layout,
    // 重定向地址，在面包屑中点击会重定向去的地址
    redirect: '/home',
    hidden: true,
    name: 'home',
    children: [
      {
        path: 'home',
        component: () => import('@/views/home/index'),
        name: 'menu',
        meta: { title: 'WMS' }
      },
      {
        path: 'second',
        component: () => import('@/views/home/second'),
        name: 'second',
        meta: { title: 'WMS' }
      }
    ]
  }
  // 网络错误缺省页
  // {
  //   path: '/networkError',
  //   name: 'NetworkError',
  //   component: () => import('@/views/errorPage/networkError.vue'),
  //   hidden: true
  // },
  // 服务器更新缺省页
  // {
  //   path: '/502',
  //   name: '502',
  //   component: () => import('@/views/errorPage/502.vue'),
  //   hidden: true
  // }
  // ------无登录时主页也可显示的菜单-用于测试
  // {
  //   path: '/test',
  //   name: 'Test',
  //   component: () => import('@/ams/testAdm/test'),
  //   hidden: true
  // },
  // ------无登录时主页也可显示的菜单-用于测试
]

/**
 * 异步挂载的路由，动态需要根据权限加载的路由表、
 * 代表那些需求动态判断权限并通过   动态添加的页面。
 */
export const asyncRoutes = [
  {
    path: '/receive',
    name: 'receive',
    sort: 1,
    meta: { title: '收货业务', icon: 'receive' },
    component: Layout,
    children: [
      {
        path: '101POReceiveToWarehouse',
        name: 'receive.101POReceiveToWarehouse',
        meta: { title: '101PO收货入库' },
        component: () => import('@/views/receive/101POReceiveToWarehouse/index')
      },
      {
        path: '101POReceiveToWarehouse-WMS',
        name: 'receive.101POReceiveToWarehouse-WMS',
        meta: { title: '101PO收货入库-WMS' },
        component: () => import('@/views/receive/101POReceiveToWarehouse-WMS/index')
      },
      {
        path: '103POReceiveToQuality',
        name: 'receive.103POReceiveToQuality',
        meta: { title: '103PO收货到质检' },
        component: () => import('@/views/receive/103POReceiveToQuality/index')
      },
      {
        path: '103POReceiveToQuality-WMS',
        name: 'receive.103POReceiveToQuality-WMS',
        meta: { title: '103PO收货到质检-WMS' },
        component: () => import('@/views/receive/103POReceiveToQuality-WMS/index')
      },
      {
        path: '105GoodToWarehouse',
        name: 'receive.105GoodToWarehouse',
        meta: { title: '105良品入库' },
        component: () => import('@/views/receive/105GoodToWarehouse/index')
      },
      {
        path: '105GoodToWarehouse-WMS',
        name: 'receive.105GoodToWarehouse-WMS',
        meta: { title: '105良品入库-WMS' },
        component: () => import('@/views/receive/105GoodToWarehouse-WMS/index')
      },
      {
        path: '122PurchaseReturnGoodsMonth',
        name: 'receive.122PurchaseReturnGoodsMonth',
        meta: { title: '122当月采购退货' },
        component: () => import('@/views/receive/122PurchaseReturnGoodsMonth/index')
      },
      {
        path: '122PurchaseReturnGoodsMonth-WMS',
        name: 'receive.122PurchaseReturnGoodsMonth-WMS',
        meta: { title: '122当月采购退货-WMS' },
        component: () => import('@/views/receive/122PurchaseReturnGoodsMonth-WMS/index')
      },
      {
        path: '124RejectsReturnGoods',
        name: 'receive.124RejectsReturnGoods',
        meta: { title: '124不良品退货' },
        component: () => import('@/views/receive/124RejectsReturnGoods/index')
      },
      {
        path: '124RejectsReturnGoods-WMS',
        name: 'receive.124RejectsReturnGoods-WMS',
        meta: { title: '124不良品退货-WMS' },
        component: () => import('@/views/receive/124RejectsReturnGoods-WMS/index')
      },
      {
        path: '161PurchaseReturnGoodsExtendMonth',
        name: 'receive.161PurchaseReturnGoodsExtendMonth',
        meta: { title: '161跨月采购退货' },
        component: () => import('@/views/receive/161PurchaseReturnGoodsExtendMonth/index')
      },
      {
        path: '161PurchaseReturnGoodsExtendMonth-WMS',
        name: 'receive.161PurchaseReturnGoodsExtendMonth-WMS',
        meta: { title: '161跨月采购退货-WMS' },
        component: () => import('@/views/receive/161PurchaseReturnGoodsExtendMonth-WMS/index')
      },
      {
        path: '511FreeReceiveToWarehouse',
        name: 'receive.511FreeReceiveToWarehouse',
        meta: { title: '511免费收货入库' },
        component: () => import('@/views/receive/511FreeReceiveToWarehouse/index')
      },
      {
        path: '511FreeReceiveToWarehouse-WMS',
        name: 'receive.511FreeReceiveToWarehouse-WMS',
        meta: { title: '511免费收货入库-WMS' },
        component: () => import('@/views/receive/511FreeReceiveToWarehouse-WMS/index')
      },
      {
        path: 'Z01FinishedToWarehouse',
        name: 'receive.Z01FinishedToWarehouse',
        meta: { title: 'Z01成品入库' },
        component: () => import('@/views/receive/Z01FinishedToWarehouse/index')
      },
      {
        alwaysShow: false,
        hidden: false,
        path: 'Z01FinishedToLineSideWarehouse-WMS',
        name: 'receive.Z01FinishedToLineSideWarehouse-WMS',
        meta: { title: '成品入库-线边仓WMS', icon: null, hidden: false },
        component: () => import('@/views/receive/Z01FinishedToLineSideWarehouse-WMS/index')
      }
    ]
  },
  {
    path: '/shipment',
    name: 'shipment',
    sort: 2,
    meta: { title: '出货业务', icon: 'shipment' },
    component: Layout,
    children: [
      {
        path: '201DeptPicking',
        name: 'shipment.201DeptPicking',
        meta: { title: '201部门领料' },
        component: () => import('@/views/shipment/201DeptPicking/index')
      },
      {
        path: '201DeptPickingWMS',
        name: 'shipment.201DeptPickingWMS',
        meta: { title: '201部门领料-WMS' },
        component: () => import('@/views/shipment/201DeptPickingWMS/index')
      },
      {
        path: '202DeptReturn',
        name: 'shipment.202DeptReturn',
        meta: { title: '202部门退料' },
        component: () => import('@/views/shipment/202DeptReturn/index')
      },
      {
        path: '202DeptReturnWMS',
        name: 'shipment.202DeptReturnWMS',
        meta: { title: '202部门退料-WMS' },
        component: () => import('@/views/shipment/202DeptReturnWMS/index')
      },
      {
        path: '241EngineeringMaterialIssuance',
        name: 'shipment.241EngineeringMaterialIssuance',
        meta: { title: '241工程物资发料' },
        component: () => import('@/views/shipment/241EngineeringMaterialIssuance/index')
      },
      {
        path: '242EngineeringMaterialReturn',
        name: 'shipment.242EngineeringMaterialReturn',
        meta: { title: '242工程物资退料' },
        component: () => import('@/views/shipment/242EngineeringMaterialReturn/index')
      },
      {
        path: '241EngineeringMaterialIssuance-WMS',
        name: 'shipment.241EngineeringMaterialIssuance-WMS',
        meta: { title: '241工程物资发料-WMS' },
        component: () => import('@/views/shipment/241EngineeringMaterialIssuance-WMS/index')
      },
      {
        path: '242EngineeringMaterialReturn-WMS',
        name: 'shipment.242EngineeringMaterialReturn-WMS',
        meta: { title: '242工程物资退料-WMS' },
        component: () => import('@/views/shipment/242EngineeringMaterialReturn-WMS/index')
      },
      {
        path: '261Issuance',
        name: 'shipment.261Issuance',
        meta: { title: '261发料' },
        component: Redirect,
        children: [
          {
            path: '261SupplierPicking',
            name: 'shipment.261SupplierPicking',
            meta: { title: '261供应商领料' },
            component: () => import('@/views/shipment/261SupplierPicking/index')
          },
          {
            path: '261SupplierPickingWMS',
            name: 'shipment.261SupplierPickingWMS',
            meta: { title: '261供应商领料-WMS' },
            component: () => import('@/views/shipment/261SupplierPickingWMS/index')
          },
          {
            path: '261WarehouseDirectDelivery',
            name: 'shipment.261WarehouseDirectDelivery',
            meta: { title: '261仓库直发' },
            component: () => import('@/views/shipment/261WarehouseDirectDelivery/index')
          },
          {
            path: '261AccessoriesIssuance-LineSideWarehouseWMS',
            name: 'shipment.261AccessoriesIssuance-LineSideWarehouseWMS',
            meta: { title: '261辅料发料-线边仓-WMS' },
            component: () => import('@/views/shipment/261AccessoriesIssuance-LineSideWarehouseWMS/index')
          },
          {
            path: '261WarehouseDirectDeliveryOutSourcingWMS',
            name: 'shipment.261WarehouseDirectDeliveryOutSourcingWMS',
            meta: { title: '261仓库直发-外购件-WMS' },
            component: () => import('@/views/shipment/261WarehouseDirectDeliveryOutSourcingWMS/index')
          },
          {
            path: '261ScrewIssuanceWMS',
            name: 'shipment.261ScrewIssuanceWMS',
            meta: { title: '261螺丝发料-WMS', icon: null, hidden: false },
            component: () => import('@/views/shipment/261ScrewIssuanceWMS/index')
          },
          {
            path: '261EmbryoIssuance',
            name: 'shipment.261EmbryoIssuance',
            meta: { title: '261胚料发料' },
            component: () => import('@/views/shipment/261EmbryoIssuance/index')
          },
          {
            path: '261EmbryoIssuanceWMS',
            name: 'shipment.261EmbryoIssuanceWMS',
            meta: { title: '261胚料发料-WMS' },
            component: () => import('@/views/shipment/261EmbryoIssuanceWMS/index')
          },
          {
            path: '261EmbryoIssuance-BT',
            name: 'shipment.261EmbryoIssuance-BT',
            meta: { title: '261胚料发料-柏塘', icon: null, hidden: false },
            component: () => import('@/views/shipment/261EmbryoIssuance-BT/index')
          },
          {
            path: '261EmbryoIssuance-FT',
            name: 'shipment.261EmbryoIssuance-FT',
            meta: { title: '261胚料发料-分摊' },
            component: () => import('@/views/shipment/261EmbryoIssuance-FT/index')
          },
          {
            path: '261EmbryoIssuance-FTWMS',
            name: 'shipment.261EmbryoIssuance-FTWMS',
            meta: { title: '261胚料发料-分摊-WMS' },
            component: () => import('@/views/shipment/261EmbryoIssuance-FTWMS/index')
          }
        ]
      },
      {
        path: '262ProductionReturn',
        name: 'shipment.262ProductionReturn',
        meta: { title: '262生产退料' },
        component: () => import('@/views/shipment/262ProductionReturn/index')
      },
      {
        path: '262ProductionReturnWMS',
        name: 'shipment.262ProductionReturnWMS',
        meta: { title: '262生产退料-WMS' },
        component: () => import('@/views/shipment/262ProductionReturnWMS/index')
      },
      {
        path: '262AuxiliaryMaterialReturn',
        name: 'shipment.262AuxiliaryMaterialReturn',
        meta: { title: '262辅料退料' },
        component: () => import('@/views/shipment/262AuxiliaryMaterialReturn/index')
      },
      {
        path: '262EmbryoReturnWMS',
        name: 'shipment.262EmbryoReturnWMS',
        meta: { title: '262胚料退料-WMS' },
        component: () => import('@/views/shipment/262EmbryoReturnWMS/index')
      },
      {
        path: '262EmbryoReturn',
        name: 'shipment.262EmbryoReturn',
        meta: { title: '262胚料退料' },
        component: () => import('@/views/shipment/262EmbryoReturn/index')
      },
      {
        path: '531ByProductReceive',
        name: 'shipment.531ByProductReceive',
        meta: { title: '531副产品收货' },
        component: () => import('@/views/shipment/531ByProductReceive/index')
      },
      {
        path: '531ByProductReceiveWMS',
        name: 'shipment.531ByProductReceiveWMS',
        meta: { title: '531副产品收货-WMS' },
        component: () => import('@/views/shipment/531ByProductReceiveWMS/index')
      },
      {
        path: '541SubcontractingIssuance',
        name: 'shipment.541SubcontractingIssuance',
        meta: { title: '541委外发料', icon: null, hidden: false },
        component: () => import('@/views/shipment/541SubcontractingIssuance/index')
      },
      {
        path: '541SubcontractingIssuanceWMS',
        name: 'shipment.541SubcontractingIssuanceWMS',
        meta: { title: '541委外发料-WMS' },
        component: () => import('@/views/shipment/541SubcontractingIssuanceWMS/index')
      },
      {
        path: 'Z03ToolPicking',
        name: 'shipment.Z03ToolPicking',
        meta: { title: 'Z03工具领料' },
        component: () => import('@/views/shipment/Z03ToolPicking/index')
      },
      {
        path: 'Z03ToolPickingWMS',
        name: 'shipment.Z03ToolPickingWMS',
        meta: { title: 'Z03工具领料-WMS' },
        component: () => import('@/views/shipment/Z03ToolPickingWMS/index')
      },
      {
        path: 'Z04ToolReturn',
        name: 'shipment.Z04ToolReturn',
        meta: { title: 'Z04工具退料' },
        component: () => import('@/views/shipment/Z04ToolReturn/index')
      },
      {
        path: 'Z04ToolReturnWMS',
        name: 'shipment.Z04ToolReturnWMS',
        meta: { title: 'Z04工具退料-WMS' },
        component: () => import('@/views/shipment/Z04ToolReturnWMS/index')
      },
      {
        path: '601IntercompanyShipment',
        name: 'shipment.601IntercompanyShipment',
        meta: { title: '601公司间发货' },
        component: () => import('@/views/shipment/601IntercompanyShipment/index')
      },
      {
        path: '601IntercompanyShipmentWMS',
        name: 'shipment.601IntercompanyShipmentWMS',
        meta: { title: '601公司间发货-WMS' },
        component: () => import('@/views/shipment/601IntercompanyShipmentWMS/index')
      },
      {
        path: '262ProductionReturn-LineSideWarehouseWMS',
        name: 'shipment.262ProductionReturn-LineSideWarehouseWMS',
        meta: { title: '262生产退料-线边仓-WMS' },
        component: () => import('@/views/shipment/262ProductionReturn-LineSideWarehouseWMS/index')
      }
    ]
  },
  {
    path: '/transfer',
    name: 'transfer',
    sort: 3,
    meta: { title: '转移业务', icon: 'transfer' },
    component: Layout,
    children: [
      {
        path: '301TransferBetweenFactories',
        name: 'transfer.301TransferBetweenFactories',
        meta: { title: '301工厂间调拨' },
        component: () => import('@/views/transfer/301TransferBetweenFactories/index')
      },
      {
        path: '311FactoryTransfer',
        name: 'transfer.311FactoryTransfer',
        meta: { title: '311工厂内转移' },
        component: () => import('@/views/transfer/311FactoryTransfer/index')
      },
      {
        path: '311FactoryTransferInto-WMS',
        name: 'transfer.311FactoryTransferWMSInto',
        meta: { title: '311工厂内转移（转入）-WMS' },
        component: () => import('@/views/transfer/311FactoryTransferInto-WMS/index')
      },
      {
        path: '311FactoryTransferOut-WMS',
        name: 'transfer.311FactoryTransferWMSOut',
        meta: { title: '311工厂内转移（转出）-WMS' },
        component: () => import('@/views/transfer/311FactoryTransferOut-WMS/index')
      },
      {
        path: '315MaterialPreparationTransfer',
        name: 'transfer.315MaterialPreparationTransfer',
        meta: { title: '315备料转移' },
        component: () => import('@/views/transfer/315MaterialPreparationTransfer/index')
      },
      {
        path: '315MaterialPreparationTransfer-WMS',
        name: 'transfer.315MaterialPreparationTransfer-WMS',
        meta: { title: '315备料转移-WMS' },
        component: () => import('@/views/transfer/315MaterialPreparationTransfer-WMS/index')
      },
      {
        path: 'Z31TransferToWarehouse',
        name: 'transfer.Z31TransferToWarehouse',
        meta: { title: 'Z31转移到结算仓/样机仓' },
        component: () => import('@/views/transfer/Z31TransferToWarehouse/index')
      },
      {
        path: 'Z31TransferToWarehouse-WMS',
        name: 'transfer.Z31TransferToWarehouse-WMS',
        meta: { title: 'Z31转移到结算仓/样机仓-WMS' },
        component: () => import('@/views/transfer/Z31TransferToWarehouse-WMS/index')
      },
      {
        path: 'Z41RepairProductDelivery',
        name: 'transfer.Z41RepairProductDelivery',
        meta: { title: 'Z41维修品出库' },
        component: () => import('@/views/transfer/Z41RepairProductDelivery/index')
      },
      {
        path: 'Z42RepairGoodsReceipt',
        name: 'transfer.Z42RepairGoodsReceipt',
        meta: { title: 'Z42维修品收货' },
        component: () => import('@/views/transfer/Z42RepairGoodsReceipt/index')
      },
      {
        path: 'Z43CrossRegionalTransferReceipt',
        name: 'transfer.Z43CrossRegionalTransferReceipt',
        meta: { title: 'Z43跨区域调拨入库' },
        component: () => import('@/views/transfer/Z43CrossRegionalTransferReceipt')
      },
      {
        path: 'Z43CrossRegionalTransferReceipt-WMS',
        name: 'transfer.Z43CrossRegionalTransferReceipt-WMS',
        meta: { title: 'Z43跨区域调拨入库-WMS' },
        component: () => import('@/views/transfer/Z43CrossRegionalTransferReceipt-WMS/index')
      },
      {
        path: 'Z44CrossRegionalTransferPicking',
        name: 'transfer.Z44CrossRegionalTransferPicking',
        meta: { title: 'Z44跨区域调拨拣货' },
        component: () => import('@/views/transfer/Z44CrossRegionalTransferPicking/index')
      },
      {
        path: 'Z44CrossRegionalTransferPicking-WMS',
        name: 'transfer.Z44CrossRegionalTransferPicking-WMS',
        meta: { title: 'Z44跨区域调拨拣货-WMS' },
        component: () => import('@/views/transfer/Z44CrossRegionalTransferPicking-WMS/index')
      },
      {
        path: 'crossRegionalReception-WMS',
        name: 'transfer.crossRegionalReception-WMS',
        meta: { title: '跨区域接收-WMS' },
        component: () => import('@/views/transfer/crossRegionalReception-WMS/index')
      },
      {
        path: '315MaterialPreparationTransferLineSideWarehouse-WMS',
        name: 'transfer.315MaterialPreparationTransferLineSideWarehouse-WMS',
        meta: { title: '315辅料备料转移-线边仓WMS' },
        component: () => import('@/views/transfer/315MaterialPreparationTransferLineSideWarehouse-WMS/index')
      },
      {
        path: 'crossRegionalDelivery-WMS',
        name: 'transfer.crossRegionalDelivery-WMS',
        meta: { title: '跨区域快递绑定' },
        component: () => import('@/views/transfer/crossRegionalDelivery-WMS/index')
      },
      {
        path: 'DeliveryUnbinding',
        name: 'transfer.DeliveryUnbinding',
        meta: { title: '跨区域快递解绑' },
        component: () => import('@/views/transfer/DeliveryUnbinding/index')
      }
    ]
  },
  {
    path: '/wmsFunction',
    name: 'WMSFunction',
    sort: 4,
    meta: { title: 'WMS功能', icon: 'WMSFunction' },
    component: Layout,
    children: [
      {
        path: 'InventoryBind-WMS',
        name: 'WMSFunction.InventoryBind-WMS',
        meta: { title: '库存绑定-WMS' },
        component: () => import('@/views/wmsFunction/InventoryBind-WMS/index')
      },
      {
        path: 'MaterialTransfer-WMS',
        name: 'WMSFunction.MaterialTransfer-WMS',
        meta: { title: '物料箱号调拨-WMS' },
        component: () => import('@/views/wmsFunction/MaterialTransfer-WMS/index')
      },
      {
        path: 'BoxTransfer-WMS',
        name: 'WMSFunction.BoxTransfer-WMS',
        meta: { title: '整箱物料调拨-WMS' },
        component: () => import('@/views/wmsFunction/BoxTransfer-WMS/index')
      },
      {
        path: 'BoxBingAndUnbind-WMS',
        name: 'WMSFunction.BoxBingAndUnbind-WMS',
        meta: { title: '载具绑定/解绑货位-WMS' },
        component: () => import('@/views/wmsFunction/BoxBingAndUnbind-WMS/index')
      },
      {
        path: 'BadBoxBind',
        name: 'WMSFunction.BadBoxBind',
        meta: { title: '不良箱号绑定-WMS' },
        component: () => import('@/views/wmsFunction/BadBoxBind/index')
      },
      {
        path: 'MaterialTypeSorting-WMS',
        name: 'WMSFunction.MaterialTypeSorting-WMS',
        meta: { title: '物料类型分拣-WMS' },
        component: () => import('@/views/wmsFunction/MaterialTypeSorting-WMS/index')
      },
      {
        path: 'MaterialInfoModify-WMS',
        name: 'WMSFunction.MaterialInfoModify-WMS',
        meta: { title: '物料主数据信息修改' },
        component: () => import('@/views/wmsFunction/MaterialInfoModify-WMS/index')
      },
      {
        path: 'Inventory-WMS',
        name: 'WMSFunction.Inventory-WMS',
        meta: { title: '盘点单-WMS' },
        component: () => import('@/views/wmsFunction/Inventory-WMS/index')
      },
      {
        path: 'Inventory-WMS/indexDetails',
        name: 'WMSFunction.InventoryDetails-WMS',
        meta: { title: '盘点明细-WMS' },
        component: () => import('@/views/wmsFunction/Inventory-WMS/indexDetails')
      },
      {
        path: 'Inventory-WMS/inventoryDifferenceAdjustment',
        name: 'InventoryDifferenceAdjustment',
        meta: { title: '库存差异调整' },
        component: () => import('@/views/wmsFunction/InventoryDifferenceAdjustment')
      },
      {
        path: 'BoxAllocation',
        name: 'WMSFunction.BoxAllocation',
        meta: { title: '齐套箱调拨' },
        component: () => import('@/views/wmsFunction/BoxAllocation')
      }
    ]
  },
  {
    path: '/WMSLineSideWarehouse',
    name: 'WMSLineSideWarehouse',
    sort: 5,
    meta: { title: 'WMS装配线边物料', icon: 'WMSLineSideWarehouse' },
    component: Layout,
    children: [
      {
        path: 'clearMaterialBoxNumber',
        name: 'WMSLineSideWarehouse.clearMaterialBoxNumber',
        meta: { title: '物料箱号清除' },
        component: () => import('@/views/WMSLineSideWarehouse/clearMaterialBoxNumber/index')
      },
      {
        path: 'handoverOfCardMaterialWarehouse',
        name: 'WMSLineSideWarehouse.handoverOfCardMaterialWarehouse',
        meta: { title: '卡板物料仓库间交接' },
        component: () => import('@/views/WMSLineSideWarehouse/handoverOfCardMaterialWarehouse/index')
      },
      {
        path: 'moldInstallationForMaterialOutBound',
        name: 'WMSLineSideWarehouse.moldInstallationForMaterialOutBound',
        meta: { title: '模装现场物料出库' },
        component: () => import('@/views/WMSLineSideWarehouse/moldInstallationForMaterialOutBound/index')
      },
      {
        path: 'onSiteMaterialOutBound',
        name: 'WMSLineSideWarehouse.onSiteMaterialOutBound',
        meta: { title: '现场物料出库' },
        component: () => import('@/views/WMSLineSideWarehouse/onSiteMaterialOutBound/index')
      },
      {
        path: 'TransferAreaReception',
        name: 'WMSLineSideWarehouse.TransferAreaReception',
        meta: { title: '转运区接收' },
        component: () => import('@/views/WMSLineSideWarehouse/TransferAreaReception/index')
      },
      {
        path: 'MaterialTransfer',
        name: 'WMSLineSideWarehouse.MaterialTransfer',
        meta: { title: '物料调拨功能' },
        component: () => import('@/views/WMSLineSideWarehouse/materialTransfer/index')
      },
      {
        path: 'warehouseHandover',
        name: 'WMSLineSideWarehouse.warehouseHandover',
        meta: { title: '仓库转运申请交接' },
        component: () => import('@/views/WMSLineSideWarehouse/warehouseHandover/index')
      },
      {
        path: 'CardTransferWarehouse',
        name: 'WMSLineSideWarehouse.CardTransferWarehouse',
        meta: { title: '卡板交接出库-WMS' },
        component: () => import('@/views/WMSLineSideWarehouse/CardTransferWarehouse/index')
      },
      {
        path: 'SiteMaterialTransfer',
        name: 'WMSLineSideWarehouse.SiteMaterialTransfer',
        meta: { title: '现场物料交接' },
        component: () => import('@/views/WMSLineSideWarehouse/siteMaterialTransfer/index')
      },
      {
        path: 'VehicleReception',
        name: 'WMSLineSideWarehouse.VehicleReception',
        meta: { title: '载具接收' },
        component: () => import('@/views/WMSLineSideWarehouse/vehicleReception/index')
      },
      {
        path: 'GenerateDeliveryNote',
        name: 'WMSLineSideWarehouse.GenerateDeliveryNote',
        meta: { title: '生成送货单' },
        component: () => import('@/views/WMSLineSideWarehouse/generateDeliveryNote/index')
      }
    ]
  },
  {
    path: '/machinedWarehousing',
    name: 'machinedWarehousing',
    sort: 6,
    meta: { title: '机加仓储业务', icon: 'machinedWarehousing' },
    component: Layout,
    children: [
      {
        path: '261MachinedPartsMaterialIssuanceByBox-WMS',
        name: 'machinedWarehousing.261MachinedPartsMaterialIssuanceByBox-WMS',
        meta: { title: '261机加件发料-按箱-WMS' },
        component: () => import('@/views/machinedWarehousing/261MachinedPartsMaterialIssuanceByBox-WMS/index')
      },
      {
        path: '261MachinedPartsMaterialIssuance-WMS',
        name: 'machinedWarehousing.261MachinedPartsMaterialIssuance-WMS',
        meta: { title: '261机加件发料-WMS' },
        component: () => import('@/views/machinedWarehousing/261MachinedPartsMaterialIssuance-WMS/index')
      },
      {
        path: '261MachinedPartsMaterialPreparationAndIssuance-WMS',
        name: 'machinedWarehousing.261MachinedPartsMaterialPreparationAndIssuance-WMS',
        meta: { title: '261机加件备料发料-WMS' },
        component: () => import('@/views/machinedWarehousing/261MachinedPartsMaterialPreparationAndIssuance-WMS/index')
      },
      {
        path: '315MachinedPartsMaterialPreparation-WMS',
        name: 'machinedWarehousing.315MachinedPartsMaterialPreparation-WMS',
        meta: { title: '315机加件备料-WMS' },
        component: () => import('@/views/machinedWarehousing/315MachinedPartsMaterialPreparation-WMS/index')
      },
      {
        path: 'machinedWarehousingInventory',
        name: 'machinedWarehousing.machinedWarehousingInventory',
        meta: { title: '自制机加件入库' },
        component: () => import('@/views/machinedWarehousing/machinedWarehousingInventory/index')
      },
      {
        path: 'warehousingOfSelfMadeMachineParts',
        name: 'machinedWarehousing.warehousingOfSelfMadeMachineParts',
        meta: { title: '自制机加件入库-WMS' },
        component: () => import('@/views/machinedWarehousing/warehousingOfSelfMadeMachineParts/index')
      },
      {
        path: '261MachinedPartsMaterialIssuance',
        name: 'machinedWarehousing.261MachinedPartsMaterialIssuance',
        meta: { title: '261机加件发料' },
        component: () => import('@/views/machinedWarehousing/261MachinedPartsMaterialIssuance/index')
      }
      // {
      //   path: 'Machined105GoodToWarehouseWMS',
      //   name: 'machinedWarehousing.Machined105GoodToWarehouseWMS',
      //   meta: { title: '105良品入库WMS（机加）' },
      //   component: () => import('@/views/machinedWarehousing/105GoodToWarehouseMachined-WMS/index')
      // }
    ]
  },
  {
    path: '/query',
    name: 'query',
    sort: 7,
    meta: { title: '查询业务', icon: 'query' },
    component: Layout,
    children: [
      {
        path: 'paymentDateOfMilitaryOrderInBT',
        name: 'query.paymentDateOfMilitaryOrderInBT',
        meta: { title: '柏塘军令状纳期查询' },
        component: () => import('@/views/query/paymentDateOfMilitaryOrderInBT/index')
      },
      {
        path: 'productionOrderStatusQuery',
        name: 'query.productionOrderStatusQuery',
        meta: { title: '生产订单状态查询' },
        component: () => import('@/views/query/productionOrderStatusQuery/index')
      },
      {
        path: 'barcodeQuery',
        name: 'query.barcodeQuery',
        meta: { title: '条码查询' },
        component: () => import('@/views/query/barcodeQuery/index')
      },
      {
        path: 'materialVoucherQuery',
        name: 'query.materialVoucherQuery',
        meta: { title: '物料凭证查询' },
        component: () => import('@/views/query/materialVoucherQuery/index')
      },
      {
        path: 'projectStationQuery',
        name: 'query.projectStationQuery',
        meta: { title: '项目工位查询' },
        component: () => import('@/views/query/projectStationQuery/index')
      },
      {
        path: 'componentQuery',
        name: 'query.componentQuery',
        meta: { title: '组件查询' },
        component: () => import('@/views/query/componentQuery/index')
      },
      {
        path: 'latestStatusQuery',
        name: 'query.latestStatusQuery',
        meta: { title: '最新状态查询' },
        component: () => import('@/views/query/latestStatusQuery/index')
      },
      {
        path: 'inventoryQuery',
        name: 'query.inventoryQuery',
        meta: { title: '库存查询' },
        component: () => import('@/views/query/inventoryQuery/index')
      },
      {
        path: 'inventoryQuery-WMS',
        name: 'query.inventoryQuery-WMS',
        meta: { title: '库存查询-WMS' },
        component: () => import('@/views/query/inventoryQuery-WMS/index')
      }
    ]
  },
  {
    path: '/logisticsAGVDistribution',
    name: 'logisticsAGVDistribution',
    sort: 8,
    meta: { title: '调度业务', icon: 'receive' },
    component: Layout,
    children: [
      {
        path: 'cardLoadingStatus-WMS',
        name: 'logisticsAGVDistribution.cardLoadingStatus-WMS',
        meta: { title: '卡板装载状态-WMS' },
        component: () => import('@/views/logisticsAGVDistribution/cardLoadingStatus-WMS/index')
      },
      {
        path: 'cardboardBindingMaterialRack-WMS',
        name: 'logisticsAGVDistribution.cardboardBindingMaterialRack-WMS',
        meta: { title: '卡板绑定料架-WMS' },
        component: () => import('@/views/logisticsAGVDistribution/cardboardBindingMaterialRack-WMS/index')
      },
      {
        path: 'materialRackBindingAndWaitingForStorageArea-WMS',
        name: 'logisticsAGVDistribution.materialRackBindingAndWaitingForStorageArea-WMS',
        meta: { title: '料架绑定/解绑货位-WMS' },
        component: () => import('@/views/logisticsAGVDistribution/materialRackBindingAndWaitingForStorageArea-WMS/index')
      },
      {
        path: 'materialRackStorage-WMS',
        name: 'logisticsAGVDistribution.materialRackStorage-WMS',
        meta: { title: '料架入库-WMS' },
        component: () => import('@/views/logisticsAGVDistribution/materialRackStorage-WMS/index')
      },
      {
        path: 'materialRackOutbound-WMS',
        name: 'logisticsAGVDistribution.materialRackOutbound-WMS',
        meta: { title: '料架出库-WMS' },
        component: () => import('@/views/logisticsAGVDistribution/materialRackOutbound-WMS/index')
      },
      {
        path: 'emptyMaterialRackOutbound-WMS',
        name: 'logisticsAGVDistribution.emptyMaterialRackOutbound-WMS',
        meta: { title: '空料架出库-WMS' },
        component: () => import('@/views/logisticsAGVDistribution/emptyMaterialRackOutbound-WMS/index')
      },
      {
        path: 'AGVInStorage',
        name: 'logisticsAGVDistribution.AGVInStorage',
        meta: { title: '呼叫AGV入库-WMS' },
        component: () => import('@/views/logisticsAGVDistribution/AGVInStorage/index')
      },
      {
        path: 'LocationBatchOutStorage',
        name: 'logisticsAGVDistribution.LocationBatchOutStorage',
        meta: { title: '项目工位批次出库-WMS' },
        component: () => import('@/views/logisticsAGVDistribution/LocationBatchOutStorage/index')
      },
      {
        path: 'logisticsStock',
        name: 'logisticsAGVDistribution.logisticsStock',
        meta: { title: '后勤备料-WMS' },
        component: () => import('@/views/logisticsAGVDistribution/logisticsStock/index')
      },
      {
        path: 'callAGV',
        name: 'logisticsAGVDistribution.callAGV',
        meta: { title: '叫车-WMS' },
        component: () => import('@/views/logisticsAGVDistribution/callAGV/index')
      },
      {
        path: 'logisticsBindingDistribution',
        name: 'logisticsAGVDistribution.logisticsBindingDistribution',
        meta: { title: '后勤绑定配送-WMS' },
        component: () => import('@/views/logisticsAGVDistribution/logisticsBindingDistribution/index')
      },
      {
        path: 'logisticsMaterialPreparation',
        name: 'logisticsAGVDistribution.logisticsMaterialPreparation',
        meta: { title: '后勤备料' },
        component: () => import('@/views/logisticsAGVDistribution/logisticsMaterialPreparation/index')
      },
      {
        path: 'agvDeliveryRelease',
        name: 'logisticsAGVDistribution.AGVDeliveryRelease',
        meta: { title: 'AGV配送放行-WMS' },
        component: () => import('@/views/logisticsAGVDistribution/agvDeliveryRelease/index')
      }
    ]
  },
  {
    path: '/wmsManagement',
    name: 'WMSManagement',
    sort: 9,
    meta: { title: 'WMS管理', icon: 'WMSManagement' },
    component: Layout,
    children: [
      {
        path: 'LocationQuery-WMS',
        name: 'WMSManagement.LocationQuery-WMS',
        meta: { title: 'WMS区域查询' },
        component: () => import('@/views/wmsManagement/LocationQuery-WMS/index')
      },
      {
        path: 'ProjectBoxQuery-WMS',
        name: 'WMSManagement.ProjectBoxQuery-WMS',
        meta: { title: '项目箱号查询' },
        component: () => import('@/views/wmsManagement/ProjectBoxQuery/index')
      }
    ]
  },
  {
    path: '/CubicWarehouseManagement',
    name: 'CubicWarehouseManagement',
    sort: 9,
    meta: { title: '立体库管理', icon: 'WMSManagement' },
    component: Layout,
    children: [
      {
        path: 'VehicleRemoval',
        name: 'CubicWarehouseManagement.VehicleRemoval',
        meta: { title: '库存箱下架' },
        component: () => import('@/views/CubicWarehouseManagement/VehicleRemoval/index')
      }
    ]
  }
]
// 实例化vue的时候只挂载constantRouter
const createRouter = () =>
  new Router({
    // mode: 'history', // require service support
    scrollBehavior: () => ({
      y: 0
    }),
    routes: constantRoutes
  })

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router

// 解决报错 Error: Redirected when going from "" to "" via a navigation guard.
const originalPush = Router.prototype.push
Router.prototype.push = function push(location, onResolve, onReject) {
  if (onResolve || onReject) {
    return originalPush.call(this, location, onResolve, onReject)
  }
  return originalPush.call(this, location).catch((err) => err)
}
