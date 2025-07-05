<template>
  <div class="nike-complete-layout">
    <!-- Navigation Component -->
    <Nav />

    <!-- Main Content -->
    <main class="nike-layout">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-container">
          <div class="hero-content">
            <p class="hero-subtitle">Bộ Sưu Tập Giày Của Chúng Tôi</p>
            <h1 class="hero-title">
              Giày<br>
              <span class="highlight">Nike</span> Mới Ra Mắt
            </h1>
            <p class="hero-description">
              Khám phá những mẫu giày Nike thời trang, chất lượng 
              thoải mái và sự đổi mới cho cuộc sống năng động của bạn.
            </p>
            <button class="cta-button" @click="scrollToProducts">
              Mua ngay
              <svg class="button-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
              </svg>
            </button>
          </div>
          <div class="hero-image">
            <div class="featured-shoe-container">
              <div class="shoe-placeholder">
                <svg viewBox="0 0 200 120" class="shoe-icon">
                  <path d="M20 80 Q30 60 60 55 Q100 50 140 55 Q170 60 180 80 L175 90 Q150 95 100 95 Q50 95 25 90 Z" fill="#FFD700"/>
                  <path d="M25 90 Q50 100 100 100 Q150 100 175 90 L170 95 Q145 100 100 100 Q55 100 30 95 Z" fill="#FFA500"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Stats Section -->
        <div class="stats-section">
          <div class="stat-item">
            <h3 class="stat-number">1K+</h3>
            <p class="stat-label">Thương hiệu</p>
          </div>
          <div class="stat-item">
            <h3 class="stat-number">250+</h3>
            <p class="stat-label">Cửa hàng</p>
          </div>
          <div class="stat-item">
            <h3 class="stat-number">250K+</h3>
            <p class="stat-label">Khách hàng</p>
          </div>
        </div>
      </section>

      <!-- Enhanced Products Section -->
      <section class="products-section" ref="productsSection">
        <!-- Background decorations -->
        <div class="section-background">
          <div class="bg-decoration bg-decoration-1"></div>
          <div class="bg-decoration bg-decoration-2"></div>
          <div class="bg-decoration bg-decoration-3"></div>
        </div>

        <div class="products-container">
          <div class="section-header">
            <div class="section-badge">Sản phẩm nổi bật</div>
            <h2 class="section-title">
              <span class="highlight-gradient">Sản Phẩm</span> Phổ Biến
            </h2>
            <p class="section-description">
              Trải nghiệm chất lượng và phong cách hàng đầu với các lựa chọn được tìm kiếm nhiều nhất
            </p>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="products-grid">
            <div v-for="n in 8" :key="n" class="product-card-skeleton">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-line skeleton-rating"></div>
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-price"></div>
                <div class="skeleton-button"></div>
              </div>
            </div>
          </div>

          <!-- Products Grid -->
          <div v-else class="products-grid">
            <div 
              v-for="(product, index) in products"
              :key="product.id"
              @click="goToProductDetail(product)"
              class="product-card"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <!-- Product Image Container -->
              <div class="product-image-container">
                <div class="product-image-wrapper">
                  <img 
                    v-if="product.imgUrl"
                    :src="product.imgUrl"
                    :alt="product.label"
                    class="product-image"
                    @error="handleImageError"
                  />
                  <div v-else class="product-placeholder">
                    <svg viewBox="0 0 120 80" class="placeholder-icon">
                      <defs>
                        <linearGradient id="placeholderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#e5e7eb"/>
                          <stop offset="50%" stop-color="#f3f4f6"/>
                          <stop offset="100%" stop-color="#e5e7eb"/>
                        </linearGradient>
                      </defs>
                      <path d="M15 50 Q20 35 40 32 Q60 30 80 32 Q100 35 105 50 L102 58 Q85 62 60 62 Q35 62 18 58 Z" fill="url(#placeholderGradient)"/>
                      <path d="M18 58 Q35 68 60 68 Q85 68 102 58 L100 62 Q82 66 60 66 Q38 66 20 62 Z" fill="#d1d5db"/>
                    </svg>
                  </div>
                </div>
                
                <!-- Product Badge -->
                <div class="product-badge">
                  <span>Mới</span>
                </div>

                <!-- Hover Overlay -->
                <div class="product-overlay">
                  <div class="quick-view-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              <!-- Product Info -->
              <div class="product-info">
                <!-- Rating -->
                <div class="product-rating">
                  <div class="stars">
                    <span 
                      v-for="i in 5" 
                      :key="i" 
                      class="star" 
                      :class="{ filled: i <= Math.floor(product.rating) }"
                    >
                      ★
                    </span>
                  </div>
                  <span class="rating-value">({{ product.rating }})</span>
                </div>
                
                <!-- Product Name -->
                <h3 class="product-name">{{ product.label }}</h3>
                
                <!-- Product Price -->
                <div class="price-container">
                  <p class="product-price">₫{{ formatPrice(product.price) }}</p>
                  <p class="price-label">Giá tốt nhất</p>
                </div>
                
                <!-- Add to Cart Button -->
                <button class="add-to-cart-btn" @click.stop="addToCart(product)">
                  <span class="btn-content">
                    <svg class="cart-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2z"/>
                      <path d="M1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                    <span class="btn-text">Thêm vào giỏ</span>
                  </span>
                  <div class="btn-background"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer Component -->
    <Footer />
  </div>
</template>

<script>
import Nav from '@/components/user/Nav.vue';
import Footer from '@/views/user/Footer.vue';
import axios from 'axios';

export default {
  name: 'ProductList',
  
  components: {
    Nav,
    Footer
  },
  
  data() {
    return {
      products: [],
      cartItems: 0,
      loading: true
    }
  },

  methods: {
    scrollToProducts() {
      this.$refs.productsSection.scrollIntoView({ behavior: 'smooth' });
    },
    
    goToProductDetail(product) {
      this.$router.push({
        name: 'product',
        params: { id: product.id }
      });
    },
    
    addToCart(product) {
      this.cartItems++;
      console.log('Added to cart:', product);
      this.$emit('add-to-cart', product);
      alert(`Đã thêm ${product.label} vào giỏ hàng!`);
    },
    
    handleImageError(event) {
      event.target.style.display = 'none';
    },
    
    formatPrice(price) {
      if (!price) return '0';
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  },

  mounted() {
    this.loading = true;
    axios.get('http://localhost:8080/api/san-pham-chi-tiet')
    .then(response => {
      console.log(response.data);
      this.products = response.data.map(p => ({
        id: p.id,
        imgUrl: p.hinhAnh?.duongDan ?? '',
        label: p.sanPham?.tenSanPham ?? '',
        price: p.giaBan,
        rating: 4.8,
        colorId: p.mauSac?.id,
        sizeId: p.kichCo?.id,
        productId: p.sanPham?.id
      }));
    })
    .catch(error => {
      console.error("Lỗi khi gọi API:", error);
    })
    .finally(() => {
      this.loading = false;
    });
  }
}
</script>

<style lang="scss" scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.nike-complete-layout {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.nike-layout {
  padding-top: 80px; // Space for fixed navigation
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 4rem 0;
}

.hero-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-subtitle {
  color: #FF6452;
  font-size: 1rem;
  margin-bottom: 1rem;
  font-weight: 500;
}

.hero-title {
  font-size: 4rem;
  font-weight: bold;
  color: #2c3e50;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}

.highlight {
  color: #FF6452;
}

.hero-description {
  color: #6c757d;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 500px;
}

.cta-button {
  background: #FF6452;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: #e55a4a;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(255, 100, 82, 0.3);
  }
}

.button-icon {
  width: 20px;
  height: 20px;
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.featured-shoe-container {
  width: 300px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.shoe-placeholder {
  width: 100%;
  height: 100%;
}

.shoe-icon {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1));
}

/* Stats Section */
.stats-section {
  display: flex;
  justify-content: center;
  gap: 4rem;
  margin-top: 3rem;
  padding: 2rem 0;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6c757d;
  font-size: 1rem;
}

/* Enhanced Products Section */
.products-section {
  position: relative;
  padding: 6rem 0;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%);
  overflow: hidden;
}

.section-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
  
  .bg-decoration {
    position: absolute;
    border-radius: 50%;
    opacity: 0.03;
    
    &-1 {
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, #FF6452, #ff8a80);
      top: 10%;
      left: -10%;
      animation: float 20s ease-in-out infinite;
    }
    
    &-2 {
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      top: 60%;
      right: -5%;
      animation: float 25s ease-in-out infinite reverse;
    }
    
    &-3 {
      width: 200px;
      height: 200px;
      background: linear-gradient(135deg, #06b6d4, #0891b2);
      bottom: 20%;
      left: 20%;
      animation: float 30s ease-in-out infinite;
    }
  }
}

.products-container {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  z-index: 1;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
  
  .section-badge {
    display: inline-block;
    background: linear-gradient(135deg, #FF6452, #ff8a80);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 25px;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 15px rgba(255, 100, 82, 0.3);
  }
}

.section-title {
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: 1.5rem;
  color: #1a202c;
  line-height: 1.2;
  
  .highlight-gradient {
    background: linear-gradient(135deg, #FF6452, #ff8a80, #ffd700);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.section-description {
  color: #64748b;
  font-size: 1.2rem;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
  font-weight: 400;
}

/* Loading Skeleton */
.product-card-skeleton {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  
  .skeleton-image {
    height: 280px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  .skeleton-content {
    padding: 2rem;
    
    .skeleton-line {
      height: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
      border-radius: 8px;
      margin-bottom: 1rem;
      
      &.skeleton-rating { width: 60%; }
      &.skeleton-title { width: 80%; height: 20px; }
      &.skeleton-price { width: 40%; height: 24px; }
    }
    
    .skeleton-button {
      height: 48px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
      border-radius: 12px;
      margin-top: 1rem;
    }
  }
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.5rem;
  margin-top: 3rem;
}

.product-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  animation: slideUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
  
  &:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    
    .product-image {
      transform: scale(1.1) rotate(2deg);
    }
    
    .product-overlay {
      opacity: 1;
    }
    
    .add-to-cart-btn {
      .btn-background {
        transform: scaleX(1);
      }
    }
  }
}

.product-image-container {
  position: relative;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 2.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 280px;
  overflow: hidden;
}

.product-image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.product-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.1));
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  
  .placeholder-icon {
    width: 120px;
    height: 80px;
    opacity: 0.6;
  }
}

.product-badge {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: linear-gradient(135deg, #FF6452, #ff8a80);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(255, 100, 82, 0.4);
  z-index: 2;
}

.product-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 100, 82, 0.9), rgba(255, 138, 128, 0.9));
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: all 0.3s ease;
  
  .quick-view-btn {
    background: white;
    color: #FF6452;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    transform: scale(0.8);
    transition: all 0.3s ease;
    cursor: pointer;
    
    svg {
      width: 24px;
      height: 24px;
    }
    
    &:hover {
      transform: scale(1);
    }
  }
}

.product-info {
  padding: 2rem;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  
  .stars {
    display: flex;
    gap: 0.2rem;
    
    .star {
      color: #e2e8f0;
      font-size: 1.1rem;
      transition: all 0.2s ease;
      
      &.filled {
        color: #fbbf24;
        text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
      }
    }
  }
  
  .rating-value {
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 500;
  }
}

.product-name {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1a202c;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price-container {
  margin-bottom: 1.5rem;
  
  .product-price {
    font-size: 1.8rem;
    font-weight: 900;
    background: linear-gradient(135deg, #FF6452, #ff8a80);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.25rem;
  }
  
  .price-label {
    font-size: 0.8rem;
    color: #10b981;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.add-to-cart-btn {
  position: relative;
  width: 100%;
  background: transparent;
  border: 2px solid #FF6452;
  color: #FF6452;
  padding: 1rem;
  border-radius: 16px;
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  
  .btn-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    z-index: 2;
    transition: all 0.3s ease;
    
    .cart-icon {
      width: 18px;
      height: 18px;
      transition: all 0.3s ease;
    }
    
    .btn-text {
      font-size: 1rem;
    }
  }
  
  .btn-background {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #FF6452, #ff8a80);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
    z-index: 1;
  }
  
  &:hover {
    color: white;
    border-color: #FF6452;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 100, 82, 0.3);
    
    .cart-icon {
      transform: scale(1.1);
    }
  }
}

/* Animations */
@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Responsive Design */
@media (max-width: 768px) {
  .nike-layout {
    padding-top: 60px;
  }
  
  .hero-container {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .stats-section {
    gap: 2rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  .section-title {
    font-size: 2.5rem;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
  }
  
  .products-section {
    padding: 4rem 0;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .product-info {
    padding: 1.5rem;
  }
}

</style>
