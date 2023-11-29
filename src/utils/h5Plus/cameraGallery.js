// 获取系统方法
function camera(callback) {
  // 获取到camera
  // eslint-disable-next-line no-undef
  var cmr = plus.camera.getCamera()
  // 调用cmr的captureImage方法进行拍照功能的调用
  cmr.captureImage(
    function(p) {
      // 成功回调
      // 通过resolveFileSystemURL 获取真实地址
      // eslint-disable-next-line no-undef
      plus.io.resolveLocalFileSystemURL(
        p,
        function(entry) {
          dealImage(
            entry.toLocalURL(),
            {
              width: 100,
              height: 100,
              quality: 0.7
            },
            function(base64) {
              console.log('base64', base64)
              callback(base64)
            }
          )
        },
        function(e) {
          // eslint-disable-next-line no-undef
          outLine('读取拍照文件错误：' + e.message)
        }
      )
    },
    function(e) {
      // 失败回调
    },
    {
      filename: '_doc/camera/',
      index: 1
    }
  )
}

function galleryImgs(callback, imgMaxNum) {
  console.log('galleryImgs', callback)
  // eslint-disable-next-line no-undef
  plus.gallery.pick(
    function(e) {
      // 成功回调
      // 遍历添加文件
      for (var i in e.files) {
        console.log('e.files[i]', e.files[i])
        // alert('e.files[i]', e.files[i])
        // eslint-disable-next-line no-undef
        plus.io.resolveLocalFileSystemURL(
          e.files[i],
          function(entry) {
            console.log('entry')
            dealImage(
              entry.toLocalURL(),
              {
                width: 100,
                height: 100,
                quality: 0.7
              },
              function(base64) {
                callback(base64)
              }
            )
            console.log('entry2')
          },
          function(e) {
            console.log('e', e)
            // alert('e', e)
            // eslint-disable-next-line no-undef
            outLine('读取拍照文件错误：' + e.message)
          }
        )
      }
    },
    function(e) {
      // 失败回调
      console.log('取消选择图片')
    },
    // 图库文件过滤选项
    // { filter: "image", multiple: true }
    {
      filter: 'image',
      multiple: true, // 是否可以多选
      maximum: imgMaxNum || '', // 设定最多可选取数量
      system: true, // 是否调用手机终端自带的相册页面
      onmaxed: function() {
        // eslint-disable-next-line no-undef
        plus.nativeUI.alert('最多只能选择' + imgMaxNum + '张图片')
      } // 当超过设定的选取数量触发的事件
    }
  )
}

function dealImage(path, obj, callback) {
  console.log('dealImage', path, obj, callback)
  var img = new Image()
  img.src = path
  img.onload = function() {
    console.log('onload')
    var that = this
    // 默认按比例压缩
    var w = that.width
    var h = that.height
    var scale = w / h
    w = obj.width || w
    h = obj.height || w / scale
    var quality = 0.9 // 默认图片质量为0.7
    // 生成canvas
    var canvas = document.createElement('canvas')
    var ctx = canvas.getContext('2d')
    // 创建属性节点
    var anw = document.createAttribute('width')
    anw.nodeValue = w
    var anh = document.createAttribute('height')
    anh.nodeValue = h
    canvas.setAttributeNode(anw)
    canvas.setAttributeNode(anh)
    ctx.drawImage(that, 0, 0, w, h)
    // 图像质量
    if (obj.quality && obj.quality <= 1 && obj.quality > 0) {
      quality = obj.quality
    }
    // quality值越小，所绘制出的图像越模糊
    var base64 = canvas.toDataURL('image/jpeg', quality)
    // 回调函数返回base64的值
    callback(base64)
  }
  console.log('img.src', img)
}
export { camera, galleryImgs, dealImage }
