<template>
  <view class="work-mask-overlay" @touchmove.stop.prevent>
    <view class="work-mask-card" @tap.stop>
      <view class="work-queue-viewport" aria-hidden="true">
        <view class="work-queue-marquee">
          <view class="work-queue-segment">
            <view
              v-for="(animal, index) in queueAnimals"
              :key="`segment-a-${index}`"
              class="work-queue-hop"
              :style="{ animationDelay: `${(index % 4) * 0.16}s` }"
            >
              <image
                class="work-queue-animal"
                :class="animal === 'horse' ? 'is-horse' : 'is-cow'"
                :src="animal === 'cow' ? COW_SRC : HORSE_SRC"
                mode="aspectFit"
              />
            </view>
          </view>
          <view class="work-queue-segment" aria-hidden="true">
            <view
              v-for="(animal, index) in queueAnimals"
              :key="`segment-b-${index}`"
              class="work-queue-hop"
              :style="{ animationDelay: `${(index % 4) * 0.16 + 0.08}s` }"
            >
              <image
                class="work-queue-animal"
                :class="animal === 'horse' ? 'is-horse' : 'is-cow'"
                :src="animal === 'cow' ? COW_SRC : HORSE_SRC"
                mode="aspectFit"
              />
            </view>
          </view>
        </view>
      </view>

      <text class="work-status-text">AI牛马正在为你干活，请稍候...</text>

      <button class="work-cancel-btn work-block-gap" hover-class="work-cancel-btn-hover" @click.stop="emitCancel">
        取消生成
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
const COW_SRC = '/static/cowpngpng.png'
const HORSE_SRC = '/static/horsepngpng.png'
const queueAnimals = ['cow', 'horse', 'cow', 'horse', 'cow', 'horse', 'cow', 'horse'] as const

const emit = defineEmits<{
  (event: 'cancel'): void
}>()

function emitCancel() {
  emit('cancel')
}
</script>

<style scoped>
.work-mask-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99999;
  background: rgba(255, 255, 255, 0.6);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  box-sizing: border-box;
}

.work-mask-card {
  width: 100%;
  max-width: 620rpx;
  background: transparent;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  border: 0;
  border-radius: 16rpx;
  padding: 32rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  box-shadow: none;
}

.work-block-gap {
  margin-top: 24rpx;
}

.work-queue-viewport {
  width: 100%;
  height: 116rpx;
  overflow: hidden;
  position: relative;
}

.work-queue-marquee {
  position: absolute;
  left: 0;
  top: 50%;
  display: flex;
  align-items: center;
  height: 116rpx;
  animation: queueMarquee 8s linear infinite;
  will-change: transform;
}

.work-queue-segment {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.work-queue-hop {
  margin-right: 20rpx;
  flex: 0 0 auto;
  animation: animalHop 0.88s ease-in-out infinite;
  will-change: transform;
}

.work-queue-animal {
  width: 122rpx;
  height: 82rpx;
}

.work-queue-animal.is-horse {
  width: 130rpx;
  height: 84rpx;
}

.work-status-text {
  margin-top: 24rpx;
  color: #07C160;
  font-size: 28rpx;
  line-height: 1.5;
  text-align: center;
  animation: thinkingBreath 1.8s ease-in-out infinite;
}

.work-cancel-btn {
  width: 100%;
  min-height: 80rpx;
  margin: 0;
  border: 0;
  border-radius: 16rpx;
  background: transparent;
  color: #BBBBBB;
  font-size: 28rpx;
  font-weight: 400;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.work-cancel-btn-hover {
  background: transparent;
  color: #B0B0B0;
}

@keyframes queueMarquee {
  0% {
    transform: translate3d(0, -50%, 0);
  }
  100% {
    transform: translate3d(-50%, -50%, 0);
  }
}

@keyframes animalHop {
  0% {
    transform: translate3d(0, 0, 0) scaleY(1);
  }
  30% {
    transform: translate3d(0, -12rpx, 0) scaleY(1.01);
  }
  55% {
    transform: translate3d(0, -2rpx, 0) scaleY(0.98);
  }
  100% {
    transform: translate3d(0, 0, 0) scaleY(1);
  }
}

@keyframes thinkingBreath {
  0% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.8;
  }
}
</style>
