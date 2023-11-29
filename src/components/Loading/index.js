import Vue from 'vue'
import LoadingComponent from '@/components/Loading/index.vue'
const container = document.createElement('div')
container.setAttribute('id', 'customerLoading')
const LoadingInstance = Vue.extend(LoadingComponent)
let instance = null
const Loading = {
  show(msg) {
    if (!instance) {
      instance = new LoadingInstance({el: container, props: {
        tips: msg
      }})
    }
    document.body.appendChild(instance.$el)
    console.log('显示', instance)
  },
  hide() {
    instance?.$destroy()
    instance = null
    // document.body.removeChild(container)
    console.log('关闭')
  }
}
export default Loading
