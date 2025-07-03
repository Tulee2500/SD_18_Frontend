<script setup>
import ProductCard from "@/components/user/PopularProductsCard.vue";
import { products } from "@/constants";
import "swiper/css";
import { Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import { ref } from "vue";
const slidesPerViewVar = ref(4);
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  slidesPerViewVar.value = width >= 1440 ? 4 : width >= 1024 ? 3 : width >= 500 ? 2 : 1;
});
</script>

<template>
  <section class="flex flex-col max-container">
    <div class="flex flex-col gap-5 justify-start">
      <h2 class="text-4xl font-bold font-montserrat">
        Sản Phẩm <span class="text-coral-red">Phổ Biến</span>
      </h2>
      <p class="text-slate-gray text-lg max-w-lg">
        Trải nghiệm chất lượng và phong cách hàng đầu với những lựa chọn được săn đón của chúng tôi. Khám phá thế giới của sự thoải mái, thiết kế và giá trị
      </p>
    </div>
    <div
      v-motion
      :initial="{
        opacity: 0,
        y: 200,
      }"
      :visibleOnce="{
        opacity: 1,
        y: 0,
      }"
      class="mt-10"
    >
      <Swiper
        :slides-per-view="slidesPerViewVar"
        :space-between="100"
        :loop="true"
        class="default-slider"
        :keyboard="{
          enabled: true,
        }"
        :modules="[Keyboard]"
      >
        ><SwiperSlide v-for="product in products">
          <ProductCard class="product" :product="product" :width="'280'" /> </SwiperSlide
      ></Swiper>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.swiper {
  width: 80%;
  height: 100%;
  display: flex;
  justify-content: center;
}

.swiper-slide {
  background-position: center;
  background-size: cover;
}
</style>
