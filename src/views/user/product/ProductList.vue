<template>
  <div class="nike-layout">
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

    <!-- Products Section -->
    <section class="products-section" ref="productsSection">
      <div class="products-container">
        <div class="section-header">
          <h2 class="section-title">
            <span class="highlight">Sản Phẩm</span> Phổ Biến
          </h2>
          <p class="section-description">
            Trải nghiệm chất lượng và phong cách hàng đầu với các lựa chọn được tìm kiếm nhiều nhất
          </p>
        </div>

        <div class="products-grid">
          <div 
            v-for="(product, index) in products" 
            :key="index"
            @click="goToProductDetail(product)"
            class="product-card"
          >
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
                  <svg viewBox="0 0 100 60" class="placeholder-icon">
                    <path d="M10 40 Q15 30 30 27 Q50 25 70 27 Q85 30 90 40 L87 45 Q75 47 50 47 Q25 47 13 45 Z" fill="#ddd"/>
                    <path d="M13 45 Q25 50 50 50 Q75 50 87 45 L85 47 Q72 50 50 50 Q28 50 15 47 Z" fill="#bbb"/>
                  </svg>
                </div>
              </div>
              <div class="product-badge">Mới</div>
            </div>
            
            <div class="product-info">
              <div class="product-rating">
                <div class="stars">
                  <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.floor(product.rating) }">★</span>
                </div>
                <span class="rating-value">({{ product.rating }})</span>
              </div>
              
              <h3 class="product-name">{{ product.label }}</h3>
              <p class="product-price">₫{{ formatPrice(product.price) }}</p>
              
              <button class="add-to-cart-btn" @click.stop="addToCart(product)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ProductList',
  
  data() {
    return {
      products: [],
      cartItems: 0
    }
  },
  methods: {
    scrollToProducts() {
      this.$refs.productsSection.scrollIntoView({ behavior: 'smooth' });
    },
    
    goToProductDetail(product) {
      // Navigate to product detail page with product ID
      this.$router.push({
        name: 'product',
        params: { id: product.id }
      });
    },
    
    addToCart(product) {
      this.cartItems++;
      // Add your cart logic here
      console.log('Added to cart:', product);
      
      // You can also emit an event to parent component
      this.$emit('add-to-cart', product);
      
      // Or use Vuex/Pinia store if you have one
      // this.$store.dispatch('cart/addItem', product);
      
      // Show notification
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
    axios.get('http://localhost:8080/api/san-pham-chi-tiet')
    .then(response => {
      console.log(response.data);
      this.products = response.data.map(p => ({
        id: p.id,
        imgUrl: p.hinhAnh?.duongDan ?? '',
        label: p.sanPham?.tenSanPham ?? '',
        price: p.giaBan,
        rating: 4.8,
        // Store additional data if needed
        colorId: p.mauSac?.id,
        sizeId: p.kichCo?.id,
        productId: p.sanPham?.id
      }));
    })
    .catch(error => {
      console.error("Lỗi khi gọi API:", error);
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

.nike-layout {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
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
}

.cta-button:hover {
  background: #e55a4a;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(255, 100, 82, 0.3);
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

/* Products Section */
.products-section {
  padding: 4rem 0;
  background: white;
}

.products-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.section-description {
  color: #6c757d;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.product-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  position: relative;
}

.product-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.product-image-container {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 250px;
  position: relative;
}

.product-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #FF6452;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
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
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
}

.product-placeholder,
.placeholder-icon {
  width: 100px;
  height: 60px;
  opacity: 0.5;
}

.product-info {
  padding: 1.5rem;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stars {
  display: flex;
  gap: 0.1rem;
}

.star {
  color: #ddd;
  font-size: 1rem;
}

.star.filled {
  color: #FFD700;
}

.rating-value {
  color: #6c757d;
  font-size: 0.9rem;
}

.product-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #2c3e50;
  line-height: 1.4;
}

.product-price {
  font-size: 1.5rem;
  font-weight: bold;
  color: #FF6452;
  margin-bottom: 1rem;
}

.add-to-cart-btn {
  width: 100%;
  background: #FF6452;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.add-to-cart-btn:hover {
  background: #e55a4a;
  transform: translateY(-2px);
}

.add-to-cart-btn svg {
  width: 16px;
  height: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
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

  .products-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .section-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>