<script setup>
import { copyrightSign } from "@/assets/icons"
import { footerLogo } from "@/assets/images"
import { footerLinks, socialMedia } from "@/constants"
import { useRouter } from 'vue-router'

const router = useRouter()

// Navigation helpers
const navigateToLink = (link) => {
  if (link.external || link.link?.startsWith('http')) {
    window.open(link.link, '_blank', 'noopener,noreferrer')
  } else if (link.route) {
    router.push(link.route)
  } else if (link.link) {
    router.push(link.link)
  }
}

const handleSocialClick = (social) => {
  if (social.url) {
    window.open(social.url, '_blank', 'noopener,noreferrer')
  }
}

// Current year for copyright
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
    <!-- Newsletter Section -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
      <div class="max-container">
        <div class="text-center max-w-2xl mx-auto">
          <h3 class="text-2xl md:text-3xl font-bold mb-4">
            Đăng ký nhận tin khuyến mãi
          </h3>
          <p class="text-blue-100 mb-6 text-lg">
            Nhận thông tin sản phẩm mới và ưu đãi độc quyền ngay trong email của bạn
          </p>
          <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Nhập email của bạn..."
              class="flex-1 px-4 py-3 rounded-lg border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white focus:outline-none"
            />
            <button class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 whitespace-nowrap">
              Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Footer Content -->
    <div class="max-container py-16">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <!-- Brand Section -->
        <div class="lg:col-span-2">
          <div class="space-y-6">
            <!-- Logo -->
            <router-link to="/" class="inline-block">
              <img 
                :src="footerLogo" 
                width="180" 
                alt="Logo" 
                class="hover:opacity-80 transition-opacity duration-300"
              />
            </router-link>
            
            <!-- Brand Description -->
            <p class="text-gray-300 leading-relaxed text-base">
              Khám phá bộ sưu tập giày thể thao cao cấp với thiết kế hiện đại và chất lượng tuyệt vời. 
              Tìm kiếm phong cách hoàn hảo cho bạn.
            </p>
            
            <!-- Contact Info -->
            <div class="space-y-2">
              <div class="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                <i class="pi pi-map-marker text-blue-400 text-sm"></i>
                <span class="text-sm">123 Đường ABC, Quận 1, TP.HCM</span>
              </div>
              <div class="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                <i class="pi pi-phone text-green-400 text-sm"></i>
                <a href="tel:+84123456789" class="hover:underline text-sm">+84 123 456 789</a>
              </div>
              <div class="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                <i class="pi pi-envelope text-red-400 text-sm"></i>
                <a href="mailto:support@example.com" class="hover:underline text-sm">support@example.com</a>
              </div>
            </div>
            
            <!-- Social Media -->
            <div class="pt-2">
              <h4 class="text-base font-semibold mb-3 text-gray-200">Kết nối với chúng tôi</h4>
              <div class="flex gap-2">
                <div
                  v-for="social in socialMedia"
                  :key="social.alt"
                  @click="handleSocialClick(social)"
                  class="w-9 h-9 bg-gray-700 hover:bg-blue-600 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 group"
                  :title="`Follow us on ${social.name || social.alt}`"
                >
                  <img
                    :src="social.src"
                    :alt="social.alt"
                    class="w-4 h-4 filter brightness-0 invert group-hover:brightness-100 group-hover:invert-0 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer Links - 3 Equal Columns -->
        <div class="lg:col-span-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
            <div v-for="section in footerLinks" :key="section.title" class="space-y-4">
              <h3 class="text-lg font-bold text-white border-b border-gray-700 pb-2 mb-4">
                {{ section.title }}
              </h3>
              <ul class="space-y-2">
                <li v-for="link in section.links.slice(0, 7)" :key="link.name">
                  <a
                    :href="link.link"
                    @click.prevent="navigateToLink(link)"
                    class="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group cursor-pointer text-sm"
                  >
                    <i v-if="link.icon" :class="link.icon" class="text-blue-400 group-hover:text-blue-300 text-xs"></i>
                    <span class="group-hover:translate-x-1 transition-transform duration-300">
                      {{ link.name }}
                    </span>
                    <i v-if="link.isNew" class="pi pi-star-fill text-yellow-400 text-xs animate-pulse ml-auto"></i>
                    <i v-if="link.external" class="pi pi-external-link text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-auto"></i>
                  </a>
                </li>
                <!-- Show more link if there are more than 7 items -->
                <li v-if="section.links.length > 7" class="pt-2">
                  <a
                    href="#"
                    class="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                  >
                    Xem thêm
                    <i class="pi pi-chevron-down text-xs"></i>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trust Badges Section -->
    <div class="border-t border-gray-700 py-8">
      <div class="max-container">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="flex flex-col items-center text-center space-y-3">
            <div class="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <i class="pi pi-shield text-white text-xl"></i>
            </div>
            <div>
              <h4 class="font-semibold text-white text-sm">Bảo mật thanh toán</h4>
              <p class="text-gray-400 text-xs">100% an toàn</p>
            </div>
          </div>
          
          <div class="flex flex-col items-center text-center space-y-3">
            <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <i class="pi pi-truck text-white text-xl"></i>
            </div>
            <div>
              <h4 class="font-semibold text-white text-sm">Giao hàng nhanh</h4>
              <p class="text-gray-400 text-xs">Miễn phí ship từ 500k</p>
            </div>
          </div>
          
          <div class="flex flex-col items-center text-center space-y-3">
            <div class="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <i class="pi pi-refresh text-white text-xl"></i>
            </div>
            <div>
              <h4 class="font-semibold text-white text-sm">Đổi trả dễ dàng</h4>
              <p class="text-gray-400 text-xs">30 ngày đổi trả</p>
            </div>
          </div>
          
          <div class="flex flex-col items-center text-center space-y-3">
            <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <i class="pi pi-headphones text-white text-xl"></i>
            </div>
            <div>
              <h4 class="font-semibold text-white text-sm">Hỗ trợ 24/7</h4>
              <p class="text-gray-400 text-xs">Tư vấn chuyên nghiệp</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Methods -->
    <div class="border-t border-gray-700 py-6">
      <div class="max-container">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="text-center md:text-left">
            <h4 class="font-semibold text-white mb-3 text-sm">Phương thức thanh toán</h4>
            <div class="flex items-center gap-2 flex-wrap justify-center md:justify-start">
              <div class="w-10 h-6 bg-white rounded flex items-center justify-center">
                <span class="text-xs font-bold text-blue-600">VISA</span>
              </div>
              <div class="w-10 h-6 bg-white rounded flex items-center justify-center">
                <span class="text-xs font-bold text-red-600">MC</span>
              </div>
              <div class="w-10 h-6 bg-white rounded flex items-center justify-center">
                <span class="text-xs font-bold text-pink-500">MOMO</span>
              </div>
              <div class="w-10 h-6 bg-white rounded flex items-center justify-center">
                <span class="text-xs font-bold text-blue-500">ZALO</span>
              </div>
              <div class="w-10 h-6 bg-white rounded flex items-center justify-center">
                <span class="text-xs font-bold text-blue-600">VNPAY</span>
              </div>
            </div>
          </div>
          
          <div class="text-center md:text-right">
            <h4 class="font-semibold text-white mb-3 text-sm">Chứng nhận</h4>
            <div class="flex items-center gap-2 justify-center md:justify-end">
              <div class="px-3 py-1 bg-green-600 rounded text-xs font-semibold">
                SSL Secured
              </div>
              <div class="px-3 py-1 bg-blue-600 rounded text-xs font-semibold">
                Verified Store
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Footer -->
    <div class="border-t border-gray-700 py-4">
      <div class="max-container">
        <div class="flex flex-col md:flex-row justify-between items-center gap-3">
          <div class="flex items-center gap-2 text-gray-400">
            <img :src="copyrightSign" alt="copyright" class="w-4 h-4" />
            <p class="text-sm">
              Copyright {{ currentYear }} - Tất cả quyền được bảo lưu bởi <span class="text-white font-semibold">YourBrand</span>
            </p>
          </div>
          
          <div class="flex items-center gap-4 text-xs">
            <router-link 
              to="/privacy-policy" 
              class="text-gray-400 hover:text-white transition-colors"
            >
              Chính sách bảo mật
            </router-link>
            <router-link 
              to="/terms-conditions" 
              class="text-gray-400 hover:text-white transition-colors"
            >
              Điều khoản sử dụng
            </router-link>
            <router-link 
              to="/sitemap" 
              class="text-gray-400 hover:text-white transition-colors"
            >
              Sơ đồ trang web
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.max-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

// Smooth scroll behavior
html {
  scroll-behavior: smooth;
}

// Custom scrollbar for better UX
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-600;
}

// Animation keyframes
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Hover effects for links
a, button {
  @apply transition-all duration-300 ease-in-out;
}

// Grid responsive adjustments
@media (max-width: 768px) {
  .grid {
    @apply gap-6;
  }
}

// Focus states for accessibility
button:focus,
input:focus,
a:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800;
}

// Loading skeleton animation (if needed)
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

// Interactive elements
.group:hover .group-hover\:translate-x-1 {
  transform: translateX(0.25rem);
}

.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

// Mobile-first responsive design
@media (min-width: 640px) {
  .sm\:flex-row {
    flex-direction: row;
  }
}

@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  .md\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  
  .lg\:grid-cols-12 {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
  
  .lg\:col-span-4 {
    grid-column: span 4 / span 4;
  }
  
  .lg\:col-span-8 {
    grid-column: span 8 / span 8;
  }
}

// Enhanced typography
h1, h2, h3, h4, h5, h6 {
  @apply font-montserrat;
}

p, a, span, li {
  @apply font-montserrat;
}

// Dark mode support (if needed)
@media (prefers-color-scheme: dark) {
  .footer-theme-auto {
    @apply bg-gray-900 text-white;
  }
}
</style>