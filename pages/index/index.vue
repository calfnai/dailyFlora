<template>
  <view class="shell">
    <text class="title">DailyFlora</text>
    <text class="copy">uniCloud deployment shell · 0.71.1</text>
  </view>
</template>

<script>
export default {
  name: 'DailyFloraCloudShell'
}
</script>

<style>
.shell {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  padding: 48rpx;
}

.title {
  font-size: 44rpx;
  font-weight: 600;
}

.copy {
  color: #777;
  font-size: 26rpx;
  margin-top: 18rpx;
}
</style>
