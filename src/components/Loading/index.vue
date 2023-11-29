<template>
  <Overlay :show="true">
    <div class="loading_wrapper" @click.stop>
      <Loading color="#ffffff" type="spinner">{{ tips }}</Loading>
    </div>
  </Overlay>
</template>

<script>
import { Loading, Overlay } from 'vant'
export default {
  name: 'CustomerLoading',
  components: {
    Loading,
    Overlay
  },
  props: {
    tips: { type: String, default: '数据加载中' }
  }
}
</script>
<style scoped>
.loading_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
