import Vue from 'vue'
import template from './CustomerDialog.vue'
const Component = Vue.extend(template) // 拿到继承模板后的类
let node = null
export const customerDialog = (data) => {
  node = new Component({
    data: data || {} // 将调用API传入的参数赋值给组件的data
  })
  // tips:如果界面已经有节点了，那么就不处理，说明节点已经被创建出来了
  if (!document.querySelector('.pda_customer--marsk')) {
    // 初始化组件实例对象
    // tips:使用单例模式改进设计，不允许存在多个相同的
    node.$mount()
    // 将节点插入到页面中
    document.body.appendChild(node.$el)
  }
  // 将状态转移给promise控制
  return node.init()
}
