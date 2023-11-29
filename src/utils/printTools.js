import { _showFailToast } from './message'

/**
 * @msg: 获取打印机列表
 * @return {*}
 */
const GetDeviceList = () => {
  let deviceList = []
  let main = plus.android.runtimeMainActivity()
  let Context = plus.android.importClass('android.content.Context')
  let BManager = main.getSystemService(Context.BLUETOOTH_SERVICE)
  plus.android.importClass(BManager)
  let BAdapter = BManager.getAdapter()
  plus.android.importClass(BAdapter)
  let lists = BAdapter.getBondedDevices()
  plus.android.importClass(lists)
  let iterator = lists.iterator()
  plus.android.importClass(iterator)
  while (iterator.hasNext()) {
    var d = iterator.next()
    plus.android.importClass(d)
    var temp = {
      name: d.getName(),
      address: d.getAddress(),
      status: d.getBondState(),
      uuids: d.getUuids(),
      op: d
    }
    deviceList.push(temp)
  }
  return deviceList
}
/**
 * @msg: 模版打印函数
 * @param {*} dev 蓝牙设备
 * @param {*} templateFunc 打印方法
 * @return {*}
 */
const PrintInterface = (dev, templateFunc) => {
  let BluetoothAdapter = plus.android.importClass('android.bluetooth.BluetoothAdapter')
  let UUID = plus.android.importClass('java.util.UUID')
  let uuid = UUID.fromString('00001101-0000-1000-8000-00805F9B34FB')
  let BAdapter = BluetoothAdapter.getDefaultAdapter()
  let device = BAdapter.getRemoteDevice(dev.address)
  plus.android.importClass(device)
  let bluetoothSocket = device.createInsecureRfcommSocketToServiceRecord(uuid)
  plus.android.importClass(bluetoothSocket)
  _showFailToast('开始连接')
  if (!bluetoothSocket.isConnected()) {
    bluetoothSocket.connect()
    if (bluetoothSocket.isConnected()) {
      _showFailToast('设备已连接,开始发送打印文件')
      var outputStream = bluetoothSocket.getOutputStream()
      plus.android.importClass(outputStream)
      templateFunc(outputStream)
      bluetoothSocket.close()
      if (!bluetoothSocket.isConnected()) {
        console.log('设备已关闭')
      }
    } else {
      _showFailToast('设备连接失败')
    }
  }
}

export { GetDeviceList, PrintInterface }
