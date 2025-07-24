<script setup>
import arrowRight from "@/assets/icons/arrow-right.svg";
import Card from "@/components/user/Card.vue";
import UserButton from "@/components/user/UserButton.vue";
import { statistics } from "@/constants/index";
import axios from "axios";
import "swiper/css";
import { Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import { onMounted, ref } from "vue";

// Dữ liệu hình ảnh sản phẩm
const shoesCards = ref([]);
const bigImageUrl = ref("");

// Đổi ảnh chính
const changeHeroImg = (imgUrl) => {
  bigImageUrl.value = imgUrl;
};

// Gọi API sản phẩm khi mount
onMounted(async () => {
  try {
    const res = await axios.get("http://localhost:8080/api/san-pham-chi-tiet");
    
    // Tạo map sản phẩm -> hình ảnh đầu tiên
    const map = new Map();

    res.data.forEach(detail => {
      const productId = detail.sanPham?.id;
      const hinhAnh = detail.hinhAnh;
      if (!productId || map.has(productId)) return;

      let imageUrl = "";

      if (typeof hinhAnh === "object") {
        imageUrl = hinhAnh.duongDan || hinhAnh.url || hinhAnh.path || hinhAnh.link || hinhAnh.src || "";
      } else if (typeof hinhAnh === "string") {
        imageUrl = hinhAnh;
      }

      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = "http://localhost:8080" + (imageUrl.startsWith("/") ? "" : "/") + imageUrl;
      }

      if (imageUrl) {
        map.set(productId, {
          imgUrl: imageUrl,
          id: detail.id
        });
      }
    });

    shoesCards.value = Array.from(map.values());

    // Set ảnh chính ban đầu là ảnh đầu tiên
    if (shoesCards.value.length > 0) {
      bigImageUrl.value = shoesCards.value[0].imgUrl;
    }

  } catch (err) {
    console.error("Lỗi gọi API sản phẩm:", err);
  }
});
</script>


<template>
  <section class="w-full min-h-screen flex flex-col xl:flex-row max-container">
    <div
      class="relative xl:w-2/5 flex flex-col pt-28 flex-start justify-center items-start gap-8 lg:mb-28 padding-l"
    >
      <p class="text-xl font-montserrat text-coral-red">Bộ Sưu Tập Giày Của Chúng Tôi</p>
      <h1
        class="text-8xl font-palanquin font-bold max-sm:text-4xl xl:whitespace-nowrap z-10"
      >
        <span class="">Giày</span><br />
        <span class="text-coral-red mt-3">Nike</span> Mới Ra Mắt
      </h1>
      <p class="text-lg text-slate-gray font-montserrat leading-8">
        Khám phá những mẫu giày Nike thời trang, chất lượng <br />
        thoải mái và sự đổi mới cho cuộc sống năng động của bạn.
      </p>

      <!-- Sửa từ <Button> thành <UserButton> -->
      <UserButton :iconUrl="arrowRight">Mua ngay</UserButton>

      <div class="flex justify-start flex-wrap items-start md:gap-16 gap-6 w-full mt-10">
        <div v-for="stat in statistics" :key="stat.label">
          <span class="md:text-4xl font-bold font-palanquin text-3xl">{{
            stat.value
          }}</span>
          <p class="text-lg font-palanquin text-slate-gray">{{ stat.label }}</p>
        </div>
      </div>
    </div>
    <div
      class="flex relative justify-center items-center flex-1 flex-col bg-hero min-h-screen bg-cover bg-primary bg-center mt-10 xl:mt-0 lg:overflow-x-hidden lg:overflow-y-hidden p-8 sm:p-0"
    >
      <!-- Use Vue's built-in transition for smooth image transitions -->
      <transition name="fade" mode="out-in">
        <img
          class="z-40 object-contain rotate-12 transition-all duration-1000 mix-blend-multiply"
          :key="bigImageUrl"
          :src="bigImageUrl"
          alt="Shoes collection"
          width="600"
        />
      </transition>
      <div class="w-full absolute bottom-3">
        <Swiper
          :slides-per-view="2"
          :space-between="10"
          :breakpoints="{
            '560': {
              slidesPerView: 3,
              spaceBetween: 20,
            },
             '768': {
              slidesPerView: 4,
              spaceBetween: 40,
            },
            '1024': {
              slidesPerView: 5,
              spaceBetween: 50,
            },
          }"
          :loop="true"
          :keyboard="true"
          :modules="[Keyboard]"
        >
          <SwiperSlide v-for="shoe in shoesCards" :key="shoe.imgUrl">
            <Card
            
              :key="shoe.imgUrl"
              :imgUrl="shoe.imgUrl"
              :width="'140'"
              :isActive="bigImageUrl == shoe.imgUrl"
              @change-hero-img="changeHeroImg"
            />
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.fade-enter-active, .fade-leave-active {
  transition: all 1s ease;
  rotate: 20deg;
}

.fade-enter-from, .fade-leave-to {
  transform: translateX(800px);
}

.swiper {
  width: 90%;
  height: 100%;
}

.swiper-slide {
  background-position: center;
  background-size: cover;
}
</style>
