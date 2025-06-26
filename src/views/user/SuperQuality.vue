<script setup>
import UserButton from "@/components/user/UserButton.vue";
import { arrowRight } from "@/assets/icons";
import Image from "@/assets/images/shoe8.svg";

</script>
<template>
  <section
    v-motion
    :initial="{
      opacity: 0,
      y: 200,
    }"
    :visibleOnce="{
      opacity: 1,
      y: 0,
    }"
    class="flex flex-wrap justify-between max-[1140px]:justify-center max-lg:gap-16 items-center max-container"
  >
    <div class="space-y-12 max-w-lg">
      <h2 class="heading">
        Giày Chất Lượng <span class="text-coral-red">Dành Cho Bạn.</span>
      </h2>
      <p class="description">
        Đảm bảo sự thoải mái và phong cách cao cấp, những đôi giày được chế tác tỉ mỉ của chúng tôi được thiết kế để nâng cao trải nghiệm của bạn, mang đến cho bạn chất lượng vô song, sự đổi mới và một chút thanh lịch.
      </p>
      <p class="description">
        Sự tận tâm của chúng tôi đến từng chi tiết và sự xuất sắc đảm bảo sự hài lòng của bạn
      </p>
      <UserButton :icon-url="arrowRight">Mua ngay</UserButton>
    </div>
    <div class=" ">
      <img
        class="z-10 object-contain"
        :src="Image"
        alt="Shoes collection"
        :width="'500'"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped></style>
