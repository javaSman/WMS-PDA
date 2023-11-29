<template>
  <div class="redirect-container">
    <!-- 子路由出口 -->
    <router-view />
    <!-- /子路由出口 -->
  </div>
</template>

<script>
export default {
  name: 'RedirectIndex',
  components: {},
  props: {},
  data() {
    return {
      active: 0
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {}
}
</script>

<style scoped lang="scss"></style>
