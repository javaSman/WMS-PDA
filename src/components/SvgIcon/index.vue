<template>
  <svg class="svg-icon" aria-hidden="true">
    <use :xlink:href="`#icon-${iconFileName}`" />
  </svg>
</template>

<script>
export default {
  name: 'SvgIcon',
  props: {
    iconFileName: {
      type: String,
      default: '404'
    }
  }
}
</script>

<style lang="scss" scoped>
.svg-icon {
  width: 1.5em;
  height: 1.5em;
  overflow: hidden;
  vertical-align: -0.15em;
  fill: currentColor;
  color: #ccc;
}
</style>
