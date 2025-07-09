<script setup>
import headerLogo from "@/assets/images/header-logo.svg";
import { navLinks } from "@/constants/index.js";
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from 'vue-router';

// Thêm state cho giỏ hàng
const cartItemCount = ref(3); // Ví dụ có 3 sản phẩm trong giỏ

const router = useRouter();

const secondNavOpen = ref(false);

const navToggler = () => {
  secondNavOpen.value = !secondNavOpen.value;
};

const handleResize = () => {
  if (window.innerWidth > 1024) {
    secondNavOpen.value = true;
  } else {
    secondNavOpen.value = false;
  }
};

// Hàm chuyển đến trang đăng nhập
const goToLogin = () => {
  router.push('/auth/login');
};

// Hàm chuyển đến trang giỏ hàng
const goToCart = () => {
  router.push('/cart');
};

onMounted(() => {
  // Khởi tạo trạng thái ban đầu
  handleResize();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <header class="py-8 absolute padding-x z-50 w-full">
    <nav class="flex justify-between items-center">
      <div class="flex justify-between lg:items-center flex-col w-full lg:flex-row">
        <a href="/" class="left-5">
          <img :src="headerLogo" alt="Logo" width="150" height="29" />
        </a>

        <!-- Navigation Menu -->
        <ul
          class="max-lg:absolute max-lg:top-full max-lg:left-0 max-lg:w-full max-lg:py-5 flex-1 justify-center items-center gap-16 max-lg:gap-3 max-lg:flex-col duration-500 transition max-lg:items-start max-lg:bg-white max-lg:shadow-lg flex"
          :class="{
            'max-lg:hidden': !secondNavOpen,
            'max-lg:flex': secondNavOpen
          }"
        >
          <li
            class="text-slate-600 text-lg leading-normal font-montserrat hover:text-slate-800 transition-colors"
            v-for="navLink in navLinks"
            :key="navLink.label"
          >
            <a :href="navLink.href" v-smooth-scroll>{{ navLink.label }}</a>
          </li>
        </ul>

        <!-- Cart and Login Section -->
        <div class="flex items-center gap-6 max-lg:absolute max-lg:top-4 max-lg:right-16">
          <!-- Shopping Cart Icon -->
          <div
            class="relative cursor-pointer group p-2 hover:bg-slate-100 rounded-lg transition-colors duration-300"
            @click="goToCart"
          >
            <svg
              class="w-6 h-6 text-slate-600 group-hover:text-slate-800 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8"
              />
            </svg>
            <!-- Cart Badge -->
            <span
              v-if="cartItemCount > 0"
              class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md"
            >
              {{ cartItemCount }}
            </span>
          </div>

          <!-- Login Icon -->
          <div
            class="cursor-pointer group p-2 hover:bg-slate-100 rounded-lg transition-colors duration-300"
            @click="goToLogin"
          >
            <svg
              class="w-6 h-6 text-slate-600 group-hover:text-slate-800 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Hamburger Menu -->
      <div
        class="hidden max-lg:flex flex-col cursor-pointer gap-1 p-2 relative z-10"
        @click="navToggler"
      >
        <span
          class="w-6 h-[2px] bg-slate-600 transition-all duration-300 ease-in-out"
          :class="{
            'rotate-45 translate-y-[6px]': secondNavOpen,
            'rotate-0 translate-y-0': !secondNavOpen
          }"
        ></span>
        <span
          class="w-6 h-[2px] bg-slate-600 transition-all duration-300 ease-in-out"
          :class="{
            'opacity-0': secondNavOpen,
            'opacity-100': !secondNavOpen
          }"
        ></span>
        <span
          class="w-6 h-[2px] bg-slate-600 transition-all duration-300 ease-in-out"
          :class="{
            '-rotate-45 -translate-y-[6px]': secondNavOpen,
            'rotate-0 translate-y-0': !secondNavOpen
          }"
        ></span>
      </div>
    </nav>
  </header>
</template>

<style lang="css" scoped>
/* Custom styles */
.padding-x {
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 1024px) {
  .padding-x {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
</style>
