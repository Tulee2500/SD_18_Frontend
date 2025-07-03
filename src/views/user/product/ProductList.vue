
<template>
  <div class="nike-layout">
    <!-- Hero Section -->
     <Nav />
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
          <button class="cta-button">
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
    <section class="products-section">
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
            @click="openProductModal(product, index)"
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
              <p class="product-price">${{ product.price }}</p>
              
              <button class="add-to-cart-btn" @click.stop="addToCart(product)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7Z"/>
                </svg>
                Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Product Detail Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
          </svg>
        </button>
        
        <div class="modal-body">
          <div class="modal-image-section">
            <div class="modal-image-container">
              <img 
                v-if="selectedProduct?.imgUrl" 
                :src="selectedProduct.imgUrl" 
                :alt="selectedProduct.label"
                class="modal-product-image"
              />
              <div v-else class="modal-placeholder">
                <svg viewBox="0 0 200 120" class="modal-placeholder-icon">
                  <path d="M20 80 Q30 60 60 55 Q100 50 140 55 Q170 60 180 80 L175 90 Q150 95 100 95 Q50 95 25 90 Z" fill="#ddd"/>
                  <path d="M25 90 Q50 100 100 100 Q150 100 175 90 L170 95 Q145 100 100 100 Q55 100 30 95 Z" fill="#bbb"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div class="modal-info-section">
            <div class="modal-header">
              <h2 class="modal-title">{{ selectedProduct?.label }}</h2>
              <div class="modal-rating">
                <div class="stars">
                  <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.floor(selectedProduct?.rating || 0) }">★</span>
                </div>
                <span class="rating-text">({{ selectedProduct?.rating }} đánh giá)</span>
              </div>
            </div>
            
            <div class="modal-price">
              <span class="current-price">${{ selectedProduct?.price }}</span>
              <span class="original-price">${{ (selectedProduct?.price * 1.2).toFixed(2) }}</span>
            </div>
            
            <div class="modal-description">
              <h4>Mô tả sản phẩm</h4>
              <p>Giày thể thao cao cấp với thiết kế hiện đại, chất liệu bền bỉ và thoải mái. Phù hợp cho mọi hoạt động thể thao và đi lại hàng ngày. Công nghệ đệm tiên tiến giúp bảo vệ đôi chân của bạn.</p>
            </div>
            
            <div class="modal-features">
              <h4>Đặc điểm nổi bật</h4>
              <ul>
                <li>Chất liệu cao cấp, bền bỉ</li>
                <li>Thiết kế thời trang, hiện đại</li>
                <li>Công nghệ đệm tiên tiến</li>
                <li>Phù hợp mọi hoạt động</li>
              </ul>
            </div>
            
            <div class="modal-actions">
              <div class="quantity-selector">
                <button @click="decreaseQuantity" class="quantity-btn">-</button>
                <span class="quantity">{{ quantity }}</span>
                <button @click="increaseQuantity" class="quantity-btn">+</button>
              </div>
              
              <button class="modal-add-to-cart" @click="addToCartFromModal">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7Z"/>
                </svg>
                Thêm {{ quantity }} sản phẩm - ${{ (selectedProduct?.price * quantity).toFixed(2) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
    Footer,
    
  },
  
  data() {
    return {
      products: [],
      showModal: false,
      selectedProduct: null,
      quantity: 1,
      cartItems: 0
    }
  },
  methods: {
    openProductModal(product, index) {
      this.selectedProduct = product;
      this.showModal = true;
      this.quantity = 1;
      document.body.style.overflow = 'hidden';
    },
    
    closeModal() {
      this.showModal = false;
      this.selectedProduct = null;
      document.body.style.overflow = 'auto';
    },
    
    increaseQuantity() {
      this.quantity++;
    },
    
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--;
      }
    },
    
    addToCart(product) {
      this.cartItems++;
      // Add your cart logic here
      console.log('Added to cart:', product);
    },
    
    addToCartFromModal() {
      this.cartItems += this.quantity;
      this.closeModal();
      // Add your cart logic here
      console.log('Added to cart from modal:', this.selectedProduct, 'Quantity:', this.quantity);
    },
    
    handleImageError(event) {
      event.target.style.display = 'none';
    },
    
    goToProduct(product, index) {
      // Your existing navigation logic
      this.openProductModal(product, index);
    }
  },
  mounted() {
    axios.get('http://localhost:8080/api/san-pham-chi-tiet')
    .then(response => {
      console.log(response.data);
      this.products = response.data.map(p => ({
        imgUrl: p.hinhAnh?.duongDan ?? '',
        label: p.sanPham?.tenSanPham ?? '',
        price: p.giaBan,
        rating: 4.8
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

/* Header Styles */
.header {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nike-logo {
  width: 24px;
  height: 24px;
  color: #FF6452;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.navigation {
  display: flex;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover,
.nav-link.active {
  color: #FF6452;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-icon,
.user-icon {
  position: relative;
  cursor: pointer;
  padding: 0.5rem;
}

.cart-icon svg,
.user-icon svg {
  width: 20px;
  height: 20px;
  color: #333;
}

.cart-count {
  position: absolute;
  top: 0;
  right: 0;
  background: #FF6452;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #f8f9fa;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #e9ecef;
}

.modal-close svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.modal-image-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-image-container {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-product-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1));
}

.modal-placeholder {
  width: 200px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-placeholder-icon {
  width: 100%;
  height: 100%;
  opacity: 0.3;
}

.modal-info-section {
  padding: 3rem 3rem 3rem 0;
}

.modal-header {
  margin-bottom: 2rem;
}

.modal-title {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.modal-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-text {
  color: #6c757d;
}

.modal-price {
  margin-bottom: 2rem;
}

.current-price {
  font-size: 2rem;
  font-weight: bold;
  color: #FF6452;
  margin-right: 1rem;
}

.original-price {
  font-size: 1.2rem;
  color: #6c757d;
  text-decoration: line-through;
}

.modal-description,
.modal-features {
  margin-bottom: 2rem;
}

.modal-description h4,
.modal-features h4 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.modal-description p {
  color: #6c757d;
  line-height: 1.6;
}

.modal-features ul {
  list-style: none;
  padding: 0;
}

.modal-features li {
  color: #6c757d;
  padding: 0.5rem 0;
  position: relative;
  padding-left: 1.5rem;
}

.modal-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #FF6452;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quantity-selector {
  display: flex;
  align-items: center;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.quantity-btn {
  background: #f8f9fa;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  transition: background 0.3s ease;
}

.quantity-btn:hover {
  background: #e9ecef;
}

.quantity {
  padding: 0.75rem 1rem;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
}

.modal-add-to-cart {
  flex: 1;
  background: #FF6452;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.modal-add-to-cart:hover {
  background: #e55a4a;
  transform: translateY(-2px);
}

.modal-add-to-cart svg {
  width: 16px;
  height: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-container {
    padding: 1rem;
  }

  .navigation {
    display: none;
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

  .products-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .modal-body {
    grid-template-columns: 1fr;
  }

  .modal-info-section {
    padding: 2rem;
  }

  .modal-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .modal-overlay {
    padding: 1rem;
  }
}
.footer {
  background-color: #000;
  color: #fff;
  padding: 3rem 2rem;
}

.footer-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  gap: 2rem;
}

.footer-column {
  flex: 1 1 200px;
  min-width: 200px;
}

.footer-column h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: white;
}

.footer-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-column ul li {
  margin-bottom: 0.5rem;
  color: #ccc;
  font-size: 0.95rem;
}

.footer-column ul li:hover {
  color: #FF6452;
}

.footer-bottom {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.9rem;
  color: #888;
}

.footer-socials {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.footer-socials i {
  font-size: 1.2rem;
  cursor: pointer;
  color: #fff;
  transition: color 0.3s ease;
}

.footer-socials i:hover {
  color: #FF6452;
}

</style>
