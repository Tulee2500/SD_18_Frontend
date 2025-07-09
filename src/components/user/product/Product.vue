<template>
  <div class="product-detail-container">
    <!-- Navigation -->
    <Nav />
    <section id="home" class="xl:padding-l wide:padding-r padding-b overflow-hidden">
      <Hero />
    </section>

    <!-- Main Product Content -->
    <div class="product-main">
      <div class="container" v-if="product.sanPham">
        <div class="product-wrapper">
          <!-- Left Side - Product Images (aside) -->
          <aside class="product-gallery">
            <!-- Thumbnail Gallery -->
            <div class="thumbnail-list">
              <div 
                v-for="(img, index) in productImages"
                :key="index"
                class="thumbnail"
                :class="{ active: selectedImageIndex === index }"
                @click="selectImage(index)"
              >
                <img :src="img" :alt="`${product.sanPham.tenSanPham} ${index + 1}`" />
              </div>
            </div>
            
            <!-- Main Image -->
            <div class="main-image-container">
              <img 
                :src="selectedImage || '/placeholder-shoe.png'"
                :alt="product.sanPham.tenSanPham"
                class="main-image"
              />
              <div class="zoom-hint">Rê chuột để phóng to</div>
            </div>
          </aside>

          <!-- Right Side - Product Info (article) -->
          <article class="product-info">
            <!-- Product Title -->
            <h1 class="product-title">{{ product.sanPham.tenSanPham }}</h1>
            
            <!-- Rating -->
            <div class="rating-section">
              <div class="stars">
                <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= 5 }">★</span>
              </div>
              <a href="#reviews" class="rating-link">0 đánh giá</a>
            </div>

            <!-- Status and SKU -->
            <div class="product-status">
              <div class="status-item">
                <span class="status-icon">✓</span>
                <span>Kho hàng: <strong class="text-success">CÒN HÀNG</strong></span>
              </div>
              <div class="status-item">
                <span>● Điểm thưởng: <strong>{{ Math.floor(product.giaBan / 100) }}</strong></span>
              </div>
              <div class="status-item">
                <span>● Mã sản phẩm: <strong>{{ product.sanPham.maSanPham || 'MSL472' }}</strong></span>
              </div>
            </div>

            <!-- Price Section -->
            <div class="price-section">
              <span class="current-price">{{ formatPrice(product.giaBan) }}₫</span>
              <span class="original-price">{{ formatPrice(product.giaGoc || product.giaBan * 1.3) }}₫</span>
            </div>

            <!-- Size Selection -->
            <div class="option-section" v-if="sizes.length > 0">
              <label class="option-label">Chọn size</label>
              <div class="size-grid">
                <button 
                  v-for="size in sizes"
                  :key="size.id"
                  class="size-button"
                  :class="{
                    selected: selectedSize?.id === size.id,
                    disabled: !isSizeAvailable(size)
                  }"
                  @click="selectSize(size)"
                  :disabled="!isSizeAvailable(size)"
                >
                  {{ size.tenKichCo }}
                </button>
              </div>
              <a href="#" class="size-guide-link">
                <span class="icon">📏</span> Hướng dẫn chọn size
              </a>
            </div>

            <!-- Color Selection -->
            <div class="option-section" v-if="colors.length > 1">
              <label class="option-label">Màu sắc: <strong>{{ selectedColor?.tenMauSac }}</strong></label>
              <div class="color-options">
                <div 
                  v-for="color in colors"
                  :key="color.id"
                  class="color-option"
                  :class="{ selected: selectedColor?.id === color.id }"
                  @click="selectColor(color)"
                >
                  <img :src="color.image || '/placeholder-shoe.png'" :alt="color.tenMauSac" />
                  <span class="color-name">{{ color.tenMauSac }}</span>
                </div>
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
                <div class="quantity-selector">
                  <button @click="decreaseQuantity" class="qty-btn">-</button>
                  <input 
                    type="number"
                    v-model.number="quantity"
                    @input="validateQuantity"
                    class="qty-input"
                    min="1"
                    :max="maxQuantity"
                  />
                  <button @click="increaseQuantity" class="qty-btn">+</button>
                </div>
              </div>
              
              <div class="action-buttons">
                <button class="btn-add-cart" @click="addToCart">
                  <span class="icon">🛒</span>
                  THÊM VÀO GIỎ
                </button>
                <button class="btn-buy-now" @click="buyNow">
                  <span class="icon">⚡</span>
                  MUA HÀNG NGAY
                </button>
              </div>
            </div>

            <!-- Gift Banner -->
            <div class="gift-banner">
              <div class="gift-icon">🎁</div>
              <div class="gift-text">
                <strong>MUA GIÀY TẶNG TẤT CAO CẤP MYSHOES 🎁</strong>
                <p>Tặng tất cao cấp Myshoes khẳng khúc tính khử mùi</p>
              </div>
            </div>

            <!-- Why Choose MyShoes -->
            <div class="why-choose-section">
              <h3 class="section-title">TẠI SAO KHÁCH HÀNG LỰA CHỌN MYSHOES?</h3>
              <ul class="benefits-list">
                <li>✓ 100% Hàng chính hãng, giấy chứng nhận chính hãng</li>
                <li>✓ Đổi hàng trong 30 ngày, bảo hành 1 năm, hỗ trợ mãi trọn đời</li>
                <li>✓ Uy tín hơn 9 năm được khẳng định</li>
                <li>✓ Hơn 100.000 khách hàng đã tin tưởng</li>
                <li>✓ Nhận viền tự vấn tận tình, dịch vụ chu đáo</li>
                <li>✓ 99% khách hàng hài lòng về chất lượng sản phẩm</li>
                <li>✓ Miễn phí vận chuyển toàn quốc với đơn hàng từ 300k</li>
                <li>✓ Giá cả hợp lý, hệ thống điểm thưởng hấp dẫn</li>
              </ul>
            </div>

            <!-- Brand Logo -->
            <div class="brand-section">
              <img :src="brandLogo" alt="Brand Logo" class="brand-logo" />
            </div>
          </article>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else class="loading-container">
        <div class="loading-spinner"></div>
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    </div>

    <!-- Footer -->
    <section id="#" class="padding-x padding-t bg-black pb-8">
      <Footer />
    </section>
  </div>
</template>

<script>
import Nav from '@/components/user/Nav.vue';
import Footer from '@/views/user/Footer.vue';
import Hero from '@/views/user/Hero.vue';
import axios from 'axios';

export default {
  name: 'ProductDetail',
  data() {
    return {
      product: {},
      productImages: [],
      selectedImageIndex: 0,
      selectedColor: null,
      selectedSize: null,
      quantity: 1,
      colors: [],
      sizes: [],
      availableVariants: [],
      brandLogo: '/lacoste-logo.png'
    };
  },
  components: {
    Nav, Footer, Hero,
  },
  computed: {
    productId() {
      return this.$route.params.id || this.$route.query.id;
    },
    selectedImage() {
      return this.productImages[this.selectedImageIndex] || '/placeholder-shoe.png';
    },
    maxQuantity() {
      if (this.selectedSize && this.selectedColor) {
        const variant = this.getVariant(this.selectedColor, this.selectedSize);
        return variant?.soLuong || 99;
      }
      return this.product.soLuong || 99;
    }
  },
  methods: {
    async fetchProductDetail() {
      try {
        const response = await axios.get(`http://localhost:8080/api/san-pham-chi-tiet/${this.productId}`);
        this.product = response.data;
        
        // Set product images
        if (this.product.hinhAnh?.duongDan) {
          this.productImages = [
            this.product.hinhAnh.duongDan,
            this.product.hinhAnh.duongDan, // Duplicate for demo
            this.product.hinhAnh.duongDan,
            this.product.hinhAnh.duongDan
          ];
        } else {
          this.productImages = ['/placeholder-shoe.png'];
        }
        
        // Set brand logo based on product brand
        if (this.product.thuongHieu?.tenThuongHieu) {
          this.brandLogo = `/${this.product.thuongHieu.tenThuongHieu.toLowerCase()}-logo.png`;
        }
        
        await this.fetchVariants();
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    },
    
    async fetchVariants() {
      try {
        const [variantsRes, colorsRes, sizesRes] = await Promise.all([
          axios.get('http://localhost:8080/api/san-pham-chi-tiet'),
          axios.get('http://localhost:8080/mau-sac'),
          axios.get('http://localhost:8080/api/kich-co')
        ]);
        
        // Filter variants for this product
        this.availableVariants = variantsRes.data.filter(v => 
          v.sanPham?.id === this.product.sanPham?.id
        );
        
        // Get unique colors and sizes
        const colorIds = [...new Set(this.availableVariants.map(v => v.mauSac?.id).filter(Boolean))];
        const sizeIds = [...new Set(this.availableVariants.map(v => v.kichCo?.id).filter(Boolean))];
        
        // Filter available colors and sizes
        this.colors = colorsRes.data.filter(c => colorIds.includes(c.id) && c.trangThai === 1);
        this.sizes = sizesRes.data.filter(s => sizeIds.includes(s.id) && s.trangThai === 1)
          .sort((a, b) => parseFloat(a.tenKichCo) - parseFloat(b.tenKichCo));
        
        // Add images to colors
        this.colors = this.colors.map(color => {
          const variant = this.availableVariants.find(v => 
            v.mauSac?.id === color.id && v.hinhAnh?.duongDan
          );
          return {
            ...color,
            image: variant?.hinhAnh?.duongDan || null
          };
        });
        
        // Set default selections
        if (this.product.mauSac) {
          this.selectedColor = this.colors.find(c => c.id === this.product.mauSac.id) || this.colors[0];
        } else {
          this.selectedColor = this.colors[0];
        }
        
        if (this.product.kichCo) {
          this.selectedSize = this.sizes.find(s => s.id === this.product.kichCo.id);
        }
        
      } catch (error) {
        console.error('Error fetching variants:', error);
      }
    },
    
    selectImage(index) {
      this.selectedImageIndex = index;
    },
    
    selectColor(color) {
      this.selectedColor = color;
      this.updateProductVariant();
      
      // Update images based on color
      if (color.image) {
        this.productImages = [color.image, color.image, color.image, color.image];
        this.selectedImageIndex = 0;
      }
    },
    
    selectSize(size) {
      if (this.isSizeAvailable(size)) {
        this.selectedSize = size;
        this.updateProductVariant();
      }
    },
    
    isSizeAvailable(size) {
      if (!this.selectedColor) return true;
      
      const variant = this.getVariant(this.selectedColor, size);
      return variant && variant.soLuong > 0;
    },
    
    getVariant(color, size) {
      return this.availableVariants.find(v => 
        v.mauSac?.id === color.id && v.kichCo?.id === size.id
      );
    },
    
    updateProductVariant() {
      if (this.selectedColor && this.selectedSize) {
        const variant = this.getVariant(this.selectedColor, this.selectedSize);
        if (variant) {
          this.product = {
            ...this.product,
            ...variant,
            sanPham: this.product.sanPham,
            danhMuc: this.product.danhMuc
          };
        }
      }
    },
    
    formatPrice(price) {
      if (!price) return '0';
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },
    
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--;
      }
    },
    
    increaseQuantity() {
      if (this.quantity < this.maxQuantity) {
        this.quantity++;
      }
    },
    
    validateQuantity() {
      if (this.quantity < 1) {
        this.quantity = 1;
      } else if (this.quantity > this.maxQuantity) {
        this.quantity = this.maxQuantity;
      }
    },
    
    addToCart() {
      if (!this.selectedSize) {
        alert('Vui lòng chọn size!');
        return;
      }
      
      const cartItem = {
        productId: this.product.id,
        name: this.product.sanPham?.tenSanPham,
        price: this.product.giaBan,
        quantity: this.quantity,
        color: this.selectedColor,
        size: this.selectedSize,
        image: this.selectedImage
      };
      
      console.log('Added to cart:', cartItem);
      alert('Đã thêm vào giỏ hàng!');
    },
    
    buyNow() {
      this.addToCart();
      this.$router.push('/checkout');
    }
  },
  
  mounted() {
    this.fetchProductDetail();
  }
};
</script>

<style scoped>
.product-detail-container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.product-main {
  padding: 40px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Main Product Layout - Balanced 50/50 */
.product-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  align-items: start;
}

/* Left Side - Product Gallery (aside) */
.product-gallery {
  display: flex;
  gap: 20px;
  width: 100%;
}

.thumbnail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100px;
  flex-shrink: 0;
}

.thumbnail {
  width: 90px;
  height: 90px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.thumbnail.active {
  border-color: #ff6b35;
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2);
}

.thumbnail:hover {
  border-color: #ff6b35;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-image-container {
  flex: 1;
  position: relative;
  max-width: 500px;
}

.main-image {
  width: 100%;
  height: 500px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.zoom-hint {
  position: absolute;
  bottom: 15px;
  right: 15px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}

/* Right Side - Product Info (article) */
.product-info {
  width: 100%;
  padding: 0 20px;
}

.product-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  text-transform: uppercase;
  line-height: 1.3;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.stars {
  display: flex;
  gap: 3px;
}

.star {
  color: #ddd;
  font-size: 18px;
}

.star.filled {
  color: #ffc107;
}

.rating-link {
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
}

.product-status {
  margin-bottom: 25px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 15px;
  color: #666;
}

.status-icon {
  color: #28a745;
  font-weight: bold;
  font-size: 16px;
}

.text-success {
  color: #28a745;
}

.price-section {
  margin-bottom: 30px;
  padding: 20px 0;
  border-top: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
}

.current-price {
  font-size: 32px;
  font-weight: bold;
  color: #ff6b35;
  margin-right: 20px;
}

.original-price {
  font-size: 20px;
  color: #999;
  text-decoration: line-through;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.hotline-link {
  color: #ff6b35;
  font-weight: bold;
  text-decoration: none;
}

.option-section {
  margin-bottom: 30px;
}

.option-label {
  display: block;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
}

.size-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.size-button {
  min-width: 60px;
  height: 45px;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
}

.size-button:hover:not(.disabled) {
  border-color: #ff6b35;
}

.size-button.selected {
  border-color: #ff6b35;
  background: #ff6b35;
  color: white;
}

.size-button.disabled {
  background: #f8f9fa;
  color: #ccc;
  cursor: not-allowed;
}

.size-guide-link {
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-options {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.color-option:hover {
  background-color: #f8f9fa;
}

.color-option.selected {
  background-color: #e3f2fd;
}

.color-option img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #ddd;
}

.color-name {
  font-size: 12px;
  color: #666;
}

.purchase-section {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px 0;
  border-top: 1px solid #e9ecef;
}

.quantity-wrapper {
  display: flex;
}

.quantity-selector {
  display: flex;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.qty-btn {
  width: 45px;
  height: 45px;
  border: none;
  background: #f8f9fa;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.qty-btn:hover {
  background: #e9ecef;
}

.qty-input {
  width: 70px;
  height: 45px;
  border: none;
  text-align: center;
  font-weight: bold;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex: 1;
}

.btn-add-cart, .btn-buy-now {
  flex: 1;
  height: 55px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 15px;
}

.btn-add-cart {
  background: #007bff;
  color: white;
}

.btn-add-cart:hover {
  background: #0056b3;
  transform: translateY(-2px);
}

.btn-buy-now {
  background: #ff6b35;
  color: white;
}

.btn-buy-now:hover {
  background: #e55a2b;
  transform: translateY(-2px);
}

.gift-banner {
  display: flex;
  gap: 20px;
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  padding: 20px;
  border-radius: 10px;
  border-left: 5px solid #ff6b35;
  margin-bottom: 30px;
}

.gift-icon {
  font-size: 28px;
}

.gift-text strong {
  color: #ff6b35;
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
}

.gift-text p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.why-choose-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b35;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefits-list li {
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.5;
}

.brand-section {
  text-align: center;
  padding-top: 25px;
  border-top: 1px solid #e9ecef;
}

.brand-logo {
  max-height: 80px;
  opacity: 0.8;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #666;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b35;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .product-wrapper {
    gap: 40px;
    padding: 30px;
  }
  
  .main-image {
    height: 400px;
  }
  
  .product-title {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .product-wrapper {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 20px;
  }
  
  .product-gallery {
    flex-direction: column;
    align-items: center;
  }
  
  .thumbnail-list {
    flex-direction: row;
    justify-content: center;
    width: auto;
  }
  
  .main-image-container {
    max-width: 100%;
  }
  
  .main-image {
    height: 300px;
  }
  
  .purchase-section {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .product-title {
    font-size: 20px;
  }
  
  .current-price {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 15px;
  }
  
  .product-wrapper {
    padding: 15px;
  }
  
  .thumbnail {
    width: 70px;
    height: 70px;
  }
  
  .main-image {
    height: 250px;
  }
  
  .product-title {
    font-size: 18px;
  }
  
  .current-price {
    font-size: 24px;
  }
}
</style>