<template>
  <div class="product-detail-container">
    <!-- Navigation -->
    <Nav />
    
    <!-- Main Product Content -->
    <div class="product-main">
      <div class="container" v-if="product && !loading">
        <div class="product-wrapper">
          <!-- Left Side - Product Images -->
          <div class="product-gallery">
            <!-- Thumbnail Gallery -->
            <div class="thumbnail-gallery">
              <div 
                v-for="(image, index) in productImages"
                :key="index"
                class="thumbnail-item"
                :class="{ active: selectedImageIndex === index }"
                @click="selectImage(index)"
              >
                <img :src="image" :alt="`Product ${index + 1}`" />
              </div>
            </div>
            
            <!-- Main Image -->
            <div class="main-image-container">
              <img 
                :src="selectedImage || '/placeholder-shoe.png'"
                :alt="productName"
                class="main-image"
                @error="handleImageError"
              />
              <div class="zoom-hint">Rê chuột để phóng to</div>
            </div>
          </div>

          <!-- Right Side - Product Info -->
          <div class="product-info">
            <!-- Product Title -->
            <h1 class="product-title">{{ productName }}</h1>
            
            <!-- Rating -->
            <div class="rating-section">
              <div class="stars">
                <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= 5 }">★</span>
              </div>
              <span class="rating-text">(4.8) • 156 đánh giá</span>
            </div>

            <!-- Status -->
            <div class="product-status">
              <div class="status-item">
                <span class="status-icon">✓</span>
                <span>Kho hàng: 
                  <strong :class="product.soLuong > 0 ? 'text-success' : 'text-danger'">
                    {{ product.soLuong > 0 ? `CÒN HÀNG (${product.soLuong} sản phẩm)` : 'HẾT HÀNG' }}
                  </strong>
                </span>
              </div>
              <div class="status-item">
                <span>● Mã sản phẩm: <strong>{{ product.maChiTiet || 'N/A' }}</strong></span>
              </div>
            </div>

            <!-- Price Section -->
            <div class="price-section">
              <div class="price-row">
                <span class="current-price">{{ formatPrice(product.giaBan) }}₫</span>
                <span class="original-price" v-if="product.giaGoc">{{ formatPrice(product.giaGoc) }}₫</span>
              </div>
              <div class="discount-badge" v-if="discountPercent > 0">
                -{{ discountPercent }}%
              </div>
            </div>

            <!-- Size Info -->
            <div class="option-section" v-if="product.kichCo">
              <label class="option-label">Size: <strong>{{ product.kichCo.tenKichCo }}</strong></label>
            </div>

            <!-- Color Info -->
            <div class="option-section" v-if="product.mauSac">
              <label class="option-label">Màu sắc: <strong>{{ product.mauSac.tenMauSac }}</strong></label>
              <div class="color-display">
                <div 
                  class="color-circle"
                  :style="{ backgroundColor: getColorHex(product.mauSac.tenMauSac) }"
                ></div>
              </div>
            </div>

            <!-- Contact Info -->
            <div class="contact-info">
              <span class="hotline-icon">📞</span>
              <span>Hotline: <a href="tel:0973711868" class="hotline-link">0973 711 868</a></span>
            </div>

            <!-- Quantity and Actions -->
            <div class="purchase-section">
              <div class="quantity-wrapper">
                <label class="quantity-label">Số lượng:</label>
                <div class="quantity-selector">
                  <button @click="decreaseQuantity" class="qty-btn" :disabled="quantity <= 1">-</button>
                  <input 
                    type="number"
                    v-model.number="quantity"
                    @input="validateQuantity"
                    class="qty-input"
                    min="1"
                    :max="product.soLuong"
                  />
                  <button @click="increaseQuantity" class="qty-btn" :disabled="quantity >= product.soLuong">+</button>
                </div>
              </div>
              
              <div class="action-buttons">
                <button 
                  class="btn-add-cart"
                  @click="addToCart"
                  :disabled="product.soLuong === 0"
                >
                  <span class="icon">🛒</span>
                  THÊM VÀO GIỎ
                </button>
                <button 
                  class="btn-buy-now"
                  @click="buyNow"
                  :disabled="product.soLuong === 0"
                >
                  <span class="icon">⚡</span>
                  MUA NGAY
                </button>
              </div>
            </div>

            <!-- Gift Banner -->
            <div class="gift-banner">
              <div class="gift-icon">🎁</div>
              <div class="gift-text">
                <strong>ƯU ĐÃI ĐẶC BIỆT</strong>
                <p>Miễn phí vận chuyển cho đơn hàng từ 500.000₫</p>
              </div>
            </div>

            <!-- Product Details -->
            <div class="product-details-section">
              <h3>Thông tin sản phẩm</h3>
              <div class="details-grid">
                <div class="detail-item" v-if="product.sanPham?.thuongHieu">
                  <span class="detail-label">Thương hiệu:</span>
                  <span class="detail-value">{{ product.sanPham.thuongHieu.tenThuongHieu }}</span>
                </div>
                <div class="detail-item" v-if="product.sanPham?.danhMuc">
                  <span class="detail-label">Danh mục:</span>
                  <span class="detail-value">{{ product.sanPham.danhMuc.tenDanhMuc }}</span>
                </div>
                <div class="detail-item" v-if="product.sanPham?.chatLieu">
                  <span class="detail-label">Chất liệu:</span>
                  <span class="detail-value">{{ product.sanPham.chatLieu.tenChatLieu }}</span>
                </div>
                <div class="detail-item" v-if="product.sanPham?.deGiay">
                  <span class="detail-label">Đế giày:</span>
                  <span class="detail-value">{{ product.sanPham.deGiay.loaiDe }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Similar Products Section -->
        <div class="similar-products-section">
          <h2 class="section-title">Sản phẩm tương tự</h2>
          <div class="similar-products-grid">
            <div 
              v-for="similarProduct in similarProducts"
              :key="similarProduct.id"
              @click="goToProduct(similarProduct.id)"
              class="similar-product-card"
            >
              <div class="similar-product-image">
                <img 
                  :src="similarProduct.imgUrl || '/placeholder-shoe.png'"
                  :alt="similarProduct.label"
                  @error="handleSimilarImageError"
                />
              </div>
              <div class="similar-product-info">
                <h4>{{ similarProduct.label }}</h4>
                <p class="similar-price">{{ formatPrice(similarProduct.price) }}₫</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Đang tải thông tin sản phẩm...</p>
      </div>

      <!-- Error State -->
      <div v-else class="error-container">
        <p>Không tìm thấy sản phẩm</p>
        <button @click="goBack" class="btn-back">Quay lại</button>
      </div>
    </div>

    <!-- Footer -->
   <section id="#" class="padding-x padding-t bg-black pb-8"><Footer /></section>
  </div>
</template>

<script>
import Nav from '@/components/user/Nav.vue';
import Footer from '@/views/user/Footer.vue';
import axios from 'axios';

export default {
  name: 'Product',
  components: {
    Nav,
    Footer
  },
  data() {
    return {
      product: null,
      productImages: [],
      selectedImageIndex: 0,
      quantity: 1,
      loading: true,
      similarProducts: []
    };
  },
  computed: {
    productId() {
      return this.$route.params.id;
    },
    selectedImage() {
      return this.productImages[this.selectedImageIndex];
    },
    productName() {
      return this.product?.sanPham?.tenSanPham || 'Sản phẩm không tên';
    },
    discountPercent() {
      if (!this.product?.giaGoc || !this.product?.giaBan) return 0;
      return Math.round((1 - this.product.giaBan / this.product.giaGoc) * 100);
    }
  },
  methods: {
    async fetchProduct() {
      try {
        this.loading = true;
        const response = await axios.get(`http://localhost:8080/api/san-pham-chi-tiet/${this.productId}`);
        this.product = response.data;
        
        // Set product images
        if (this.product.hinhAnh) {
          let imageUrl = '';
          if (typeof this.product.hinhAnh === 'object') {
            imageUrl = this.product.hinhAnh.url || 
                      this.product.hinhAnh.duongDan || 
                      this.product.hinhAnh.path ||
                      this.product.hinhAnh.link ||
                      this.product.hinhAnh.src ||
                      '';
          } else if (typeof this.product.hinhAnh === 'string') {
            imageUrl = this.product.hinhAnh;
          }
          
          // Ensure full URL
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = 'http://localhost:8080' + (imageUrl.startsWith('/') ? '' : '/') + imageUrl;
          }
          
          // Create array of images (duplicate for gallery effect)
          this.productImages = imageUrl ? [imageUrl, imageUrl, imageUrl, imageUrl] : ['/placeholder-shoe.png'];
        } else {
          this.productImages = ['/placeholder-shoe.png'];
        }
        
        // Fetch similar products
        await this.fetchSimilarProducts();
      } catch (error) {
        console.error('Error fetching product:', error);
        this.product = null;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchSimilarProducts() {
      try {
        const response = await axios.get('http://localhost:8080/api/san-pham-chi-tiet');
        const allProducts = response.data.map(p => {
          let imageUrl = '';
          if (p.hinhAnh) {
            if (typeof p.hinhAnh === 'object') {
              imageUrl = p.hinhAnh.url || p.hinhAnh.duongDan || p.hinhAnh.path || '';
            } else if (typeof p.hinhAnh === 'string') {
              imageUrl = p.hinhAnh;
            }
          }
          
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = 'http://localhost:8080' + (imageUrl.startsWith('/') ? '' : '/') + imageUrl;
          }
          
          return {
            id: p.id,
            imgUrl: imageUrl,
            label: p.sanPham?.tenSanPham || 'Sản phẩm',
            price: p.giaBan || 0,
            categoryId: p.sanPham?.danhMuc?.id
          };
        });
        
        // Filter similar products (same category, different product)
        const currentCategoryId = this.product?.sanPham?.danhMuc?.id;
        this.similarProducts = allProducts
          .filter(p => p.id !== parseInt(this.productId) && 
                      (!currentCategoryId || p.categoryId === currentCategoryId))
          .slice(0, 4);
      } catch (error) {
        console.error('Error fetching similar products:', error);
      }
    },
    
    selectImage(index) {
      this.selectedImageIndex = index;
    },
    
    formatPrice(price) {
      if (!price) return '0';
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },
    
    getColorHex(colorName) {
      const colorMap = {
        'Trắng': '#ffffff',
        'Đen': '#000000',
        'Đỏ': '#ff0000',
        'Xanh Dương': '#0000ff',
        'Xanh Navy': '#001f3f',
        'Xanh Lá': '#008000',
        'Vàng': '#ffff00',
        'Cam': '#ffa500',
        'Hồng': '#ff69b4',
        'Tím': '#800080',
        'Nâu': '#8b4513',
        'Xám': '#808080',
        'Bạc': '#c0c0c0',
        'Vàng Gold': '#ffd700',
        'Be': '#f5f5dc'
      };
      return colorMap[colorName] || '#cccccc';
    },
    
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--;
      }
    },
    
    increaseQuantity() {
      if (this.quantity < this.product.soLuong) {
        this.quantity++;
      }
    },
    
    validateQuantity() {
      if (this.quantity < 1) {
        this.quantity = 1;
      } else if (this.quantity > this.product.soLuong) {
        this.quantity = this.product.soLuong;
      }
    },
    
    addToCart() {
      const cartItem = {
        id: this.product.id,
        name: this.productName,
        price: this.product.giaBan,
        quantity: this.quantity,
        image: this.selectedImage,
        size: this.product.kichCo?.tenKichCo,
        color: this.product.mauSac?.tenMauSac
      };
      
      console.log('Adding to cart:', cartItem);
      // TODO: Implement cart logic
      alert(`Đã thêm ${this.quantity} sản phẩm vào giỏ hàng!`);
    },
    
    buyNow() {
      this.addToCart();
      // TODO: Navigate to checkout
      this.$router.push('/checkout');
    },
    
    goToProduct(productId) {
      this.$router.push(`/product/${productId}`);
      // Reload data for new product
      this.fetchProduct();
    },
    
    goBack() {
      this.$router.push('/products');
    },
    
    handleImageError(event) {
      event.target.src = '/placeholder-shoe.png';
    },
    
    handleSimilarImageError(event) {
      event.target.src = '/placeholder-shoe.png';
    }
  },
  mounted() {
    this.fetchProduct();
  },
  watch: {
    '$route.params.id': {
      handler() {
        this.fetchProduct();
      }
    }
  }
};
</script>

<style scoped>
/* Container */
.product-detail-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.product-main {
  padding: 80px 0 40px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Product Wrapper */
.product-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 2px 20px rgba(0,0,0,0.08);
}

/* Gallery */
.product-gallery {
  display: flex;
  gap: 20px;
}

.thumbnail-gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.thumbnail-item {
  width: 80px;
  height: 80px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.thumbnail-item.active {
  border-color: #111;
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-image-container {
  flex: 1;
  position: relative;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.zoom-hint {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
}

/* Product Info */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.product-title {
  font-size: 32px;
  font-weight: 700;
  color: #111;
  line-height: 1.2;
}

/* Rating */
.rating-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #ddd;
  font-size: 18px;
}

.star.filled {
  color: #ff6900;
}

.rating-text {
  color: #666;
  font-size: 14px;
}

/* Status */
.product-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #555;
}

.status-icon {
  color: #4caf50;
}

.text-success {
  color: #4caf50;
}

.text-danger {
  color: #f44336;
}

/* Price */
.price-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-price {
  font-size: 36px;
  font-weight: 700;
  color: #111;
}

.original-price {
  font-size: 24px;
  color: #999;
  text-decoration: line-through;
}

.discount-badge {
  background: #ff6900;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

/* Options */
.option-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-label {
  font-size: 16px;
  color: #333;
}

.color-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
}

/* Contact */
.contact-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fffbf0;
  border-radius: 8px;
  border: 1px solid #ffd699;
}

.hotline-link {
  color: #ff6900;
  font-weight: 600;
  text-decoration: none;
}

/* Purchase Section */
.purchase-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.quantity-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.quantity-label {
  font-size: 16px;
  font-weight: 500;
}

.quantity-selector {
  display: flex;
  align-items: center;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.qty-btn {
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s;
}

.qty-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qty-input {
  width: 60px;
  height: 40px;
  border: none;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
}

.qty-input:focus {
  outline: none;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-add-cart,
.btn-buy-now {
  flex: 1;
  padding: 16px 24px;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-add-cart {
  background: white;
  color: #111;
  border: 2px solid #111;
}

.btn-add-cart:hover:not(:disabled) {
  background: #111;
  color: white;
}

.btn-buy-now {
  background: #ff6900;
  color: white;
}

.btn-buy-now:hover:not(:disabled) {
  background: #e55a00;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255,105,0,0.3);
}

.btn-add-cart:disabled,
.btn-buy-now:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Gift Banner */
.gift-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  border-radius: 12px;
  border: 1px solid #ffcccc;
}

.gift-icon {
  font-size: 32px;
}

.gift-text strong {
  display: block;
  color: #e53935;
  margin-bottom: 4px;
}

.gift-text p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

/* Product Details */
.product-details-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 24px;
}

.product-details-section h3 {
  font-size: 20px;
  margin-bottom: 16px;
  color: #111;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-label {
  color: #666;
  font-size: 14px;
}

.detail-value {
  color: #111;
  font-weight: 500;
  font-size: 14px;
}

/* Similar Products */
.similar-products-section {
  margin-top: 60px;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 32px;
  color: #111;
}

.similar-products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.similar-product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.similar-product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.15);
}

.similar-product-image {
  width: 100%;
  height: 200px;
  background: #f5f5f5;
  overflow: hidden;
}

.similar-product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.similar-product-info {
  padding: 16px;
}

.similar-product-info h4 {
  font-size: 16px;
  color: #111;
  margin-bottom: 8px;
  line-height: 1.4;
}

.similar-price {
  font-size: 18px;
  font-weight: 600;
  color: #ff6900;
}

/* Loading & Error States */
.loading-container,
.error-container {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #111;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-back {
  padding: 12px 24px;
  background: #111;
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: #333;
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 1024px) {
  .product-wrapper {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .product-gallery {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .similar-products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .product-wrapper {
    padding: 20px;
  }
  
  .product-title {
    font-size: 24px;
  }
  
  .current-price {
    font-size: 28px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .similar-products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .thumbnail-gallery {
    display: none;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .similar-products-grid {
    grid-template-columns: 1fr;
  }
}
</style>