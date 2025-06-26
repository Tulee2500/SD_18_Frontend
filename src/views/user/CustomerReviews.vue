<script setup>
import { customers } from "@/constants";
import Customer from "@/components/user/Customer.vue";
</script>
<template>
  <div class="max-container">
    <h2 class="heading text-center">
      <span class="text-coral-red">Khách Hàng</span> nói gì về chúng tôi?
    </h2>
    <p class="description text-center mx-auto">
        Hãy lắng nghe những câu chuyện chân thực từ khách hàng hài lòng về trải nghiệm tuyệt vời của họ khi hợp tác với chúng tôi.


    </p>
    <div
      class="flex flex-wrap justify-evenly gap-10 flex-1 mt-24"
         v-motion
    :initial="{
      opacity: 0,
      y: 200,
    }"
    :visibleOnce="{
      opacity: 1,
      y: 0,
    }"
    >
      <Customer v-for="customer in customers" :key="customer.name" :customer="customer" />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
