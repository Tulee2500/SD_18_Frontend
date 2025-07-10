<template>
  <div class="product-detail-container">
    <!-- Navigation -->
    <Nav />
  
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
                <span>Kho hàng: 
                  <strong :class="currentStock > 0 ? 'text-success' : 'text-danger'">
                    {{ currentStock > 0 ? `CÒN HÀNG (${currentStock} sản phẩm)` : 'HẾT HÀNG' }}
                  </strong>
                </span>
              </div>
              <div class="status-item">
                <span>● Điểm thưởng: <strong>{{ Math.floor(currentPrice / 100) }}</strong></span>
              </div>
              <div class="status-item">
                <span>● Mã sản phẩm: <strong>{{ currentVariant?.maChiTiet || product.maChiTiet || 'MSL472' }}</strong></span>
              </div>
            </div>

            <!-- Price Section -->
            <div class="price-section">
              <div class="price-row">
                <span class="current-price">{{ formatPrice(totalPrice) }}₫</span>
                <span class="original-price">{{ formatPrice(totalOriginalPrice) }}₫</span>
              </div>
              <div class="unit-price" v-if="quantity > 1">
                <span>Đơn giá: {{ formatPrice(currentPrice) }}₫ x {{ quantity }}</span>
              </div>
            </div>

            <!-- Size Selection -->
            <div class="option-section size-selection" v-if="sizes.length > 0">
              <div class="section-header">
                <label class="option-label">Size</label>
                <a href="#" class="size-guide-link" @click.prevent="showSizeGuide">
                  <span>📏</span> Hướng dẫn chọn size
                </a>
              </div>
              <div class="size-grid">
                <button 
                  v-for="size in sizes"
                  :key="size.id"
                  class="size-button"
                  :class="{
                    selected: isSelectedSize(size),
                    disabled: !isSizeAvailable(size)
                  }"
                  @click="toggleSize(size)"
                  :disabled="!isSizeAvailable(size)"
                >
                  {{ size.tenKichCo }}
                </button>
              </div>
              <div class="selected-sizes-display" v-if="selectedSizes.length > 0">
                <span>Đã chọn: <strong>Size {{ selectedSizes.map(s => s.tenKichCo).join(', ') }}</strong></span>
              </div>
            </div>

            <!-- Color Selection -->
            <div class="option-section color-selection" v-if="colors.length > 0">
              <div class="section-header">
                <label class="option-label">Màu sắc: <strong style="color: #000;">{{ selectedColor?.tenMauSac }}</strong></label>
              </div>
              <div class="color-options">
                <div
                  v-for="color in colors"
                  :key="color.id"
                  class="color-option"
                  :class="{ selected: selectedColor?.id === color.id }"
                  @click="selectColor(color)"
                >
                  <div
                    class="color-circle"
                    :style="{
                      backgroundColor: getColorHex(color.tenMauSac)
                    }"
                  ></div>
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
                <label class="quantity-label">Số lượng:</label>
                <div class="quantity-selector">
                  <button @click="decreaseQuantity" class="qty-btn" :disabled="quantity <= 1">-</button>
                  <input 
                    type="number"
                    v-model.number="quantity"
                    @input="validateQuantity"
                    class="qty-input"
                    min="1"
                    :max="currentStock"
                  />
                  <button @click="increaseQuantity" class="qty-btn" :disabled="quantity >= currentStock">+</button>
                </div>
                <span class="stock-warning" v-if="quantity === currentStock && currentStock > 0">
                  (Tối đa)
                </span>
              </div>
              
              <div class="action-buttons">
                <button 
                  class="btn-add-cart" 
                  @click="addToCart"
                  :disabled="!canAddToCart"
                >
                  <span class="icon">🛒</span>
                  THÊM VÀO GIỎ
                </button>
                <button 
                  class="btn-buy-now" 
                  @click="buyNow"
                  :disabled="!canAddToCart"
                >
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
                <p>Tặng tất cao cấp Myshoes kháng khuẩn tính khử mùi</p>
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
                <li>✓ Nhân viên tư vấn tận tình, dịch vụ chu đáo</li>
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
import axios from 'axios';

export default {
  name: 'ProductDetail',
  data() {
    return {
      product: {},
      productImages: [],
      selectedImageIndex: 0,
      selectedColor: null,
      selectedSizes: [], // Changed from selectedSize to selectedSizes array
      quantity: 1,
      colors: [],
      sizes: [],
      availableVariants: [],
      currentVariant: null,
      brandLogo: '/lacoste-logo.png'
    };
  },
  components: {
    Nav, Footer,
  },
  computed: {
    productId() {
      return this.$route.params.id || this.$route.query.id;
    },
    selectedImage() {
      return this.productImages[this.selectedImageIndex] || '/placeholder-shoe.png';
    },
    currentStock() {
      if (this.currentVariant) {
        return this.currentVariant.soLuong || 0;
      }
      return this.product.soLuong || 0;
    },
    currentPrice() {
      if (this.currentVariant) {
        return this.currentVariant.giaBan || 0;
      }
      return this.product.giaBan || 0;
    },
    currentOriginalPrice() {
      if (this.currentVariant) {
        return this.currentVariant.giaGoc || this.currentVariant.giaBan * 1.3;
      }
      return this.product.giaGoc || this.product.giaBan * 1.3 || 0;
    },
    totalPrice() {
      return this.currentPrice * this.quantity;
    },
    totalOriginalPrice() {
      return this.currentOriginalPrice * this.quantity;
    },
    canAddToCart() {
      return this.selectedSizes.length > 0 && this.selectedColor && this.quantity > 0;
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
        if (this.product.sanPham?.thuongHieu?.tenThuongHieu) {
          this.brandLogo = `/${this.product.sanPham.thuongHieu.tenThuongHieu.toLowerCase()}-logo.png`;
        }
        
        await this.fetchVariants();
      } catch (error) {
        console.error('Error fetching product:', error);
        alert('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
      }
    },
    
    async fetchVariants() {
      try {
        const variantsRes = await axios.get('http://localhost:8080/api/san-pham-chi-tiet');
        
        // Filter variants for this product
        this.availableVariants = variantsRes.data.filter(v => 
          v.sanPham?.id === this.product.sanPham?.id && v.trangThai === 1
        );
        
        // Get unique colors from variants
        const colorMap = new Map();
        this.availableVariants.forEach(v => {
          if (v.mauSac && !colorMap.has(v.mauSac.id)) {
            colorMap.set(v.mauSac.id, v.mauSac);
          }
        });
        this.colors = Array.from(colorMap.values());
        
        // Don't get sizes from variants, we'll use all sizes from API instead
        // This is handled in fetchAllSizes()
        
        // Set default selections
        if (this.product.mauSac) {
          this.selectedColor = this.colors.find(c => c.id === this.product.mauSac.id) || this.colors[0];
        } else {
          this.selectedColor = this.colors[0];
        }
        
        // Update current variant
        this.updateProductVariant();
        
      } catch (error) {
        console.error('Error fetching variants:', error);
      }
    },
    
    async fetchAllSizes() {
      try {
        const res = await axios.get('http://localhost:8080/kich-co');
        // Filter only active sizes and sort by size number
        this.sizes = res.data
          .filter(size => size.trangThai === 1)
          .sort((a, b) => parseFloat(a.tenKichCo) - parseFloat(b.tenKichCo));
        console.log('Loaded sizes:', this.sizes);
      } catch (err) {
        console.error('Lỗi khi tải kích cỡ:', err);
      }
    },
    
    getColorHex(tenMau) {
      const map = {
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
      return map[tenMau] || '#cccccc';
    },

    async fetchAllColors() {
      try {
        const res = await axios.get('http://localhost:8080/mau-sac');
        this.colors = res.data;
      } catch (err) {
        console.error('Lỗi khi tải màu sắc:', err);
      }
    },
    
    selectImage(index) {
      this.selectedImageIndex = index;
    },
    
    selectColor(color) {
      this.selectedColor = color;
      this.updateProductVariant();
      
      // Reset quantity when changing color
      this.quantity = 1;
      
      // Update images based on variant with this color
      const variantWithImage = this.availableVariants.find(v => 
        v.mauSac?.id === color.id && v.hinhAnh?.duongDan
      );
      
      if (variantWithImage?.hinhAnh?.duongDan) {
        this.productImages = [
          variantWithImage.hinhAnh.duongDan,
          variantWithImage.hinhAnh.duongDan,
          variantWithImage.hinhAnh.duongDan,
          variantWithImage.hinhAnh.duongDan
        ];
        this.selectedImageIndex = 0;
      }
    },
    
    isSelectedSize(size) {
      return this.selectedSizes.some(s => s.id === size.id);
    },
    
    toggleSize(size) {
      if (!this.isSizeAvailable(size)) return;
      
      const index = this.selectedSizes.findIndex(s => s.id === size.id);
      if (index > -1) {
        // Remove size if already selected
        this.selectedSizes.splice(index, 1);
      } else {
        // Add size if not selected
        this.selectedSizes.push(size);
      }
      
      // Update variant for the first selected size
      if (this.selectedSizes.length > 0) {
        this.updateProductVariant();
      }
    },
    
    selectSize(size) {
      // Keep this method for backward compatibility
      this.toggleSize(size);
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
          this.currentVariant = variant;
        }
      }
    },
    
    formatPrice(price) {
      if (!price) return '0';
      return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },
    
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--;
      }
    },
    
    increaseQuantity() {
      if (this.quantity < this.currentStock) {
        this.quantity++;
      }
    },
    
    validateQuantity() {
      if (this.quantity < 1) {
        this.quantity = 1;
      } else if (this.quantity > this.currentStock) {
        this.quantity = this.currentStock;
      }
    },
    
    showSizeGuide() {
      alert('Hướng dẫn chọn size:\n\n• Size 35-36: Phù hợp với bàn chân 22-23cm\n• Size 37-38: Phù hợp với bàn chân 23.5-24.5cm\n• Size 39-40: Phù hợp với bàn chân 25-26cm\n• Size 41-42: Phù hợp với bàn chân 26.5-27.5cm\n• Size 43-44: Phù hợp với bàn chân 28-29cm\n• Size 45: Phù hợp với bàn chân trên 29.5cm\n\nLưu ý: Nếu bàn chân bạn thuộc dạng bè ngang, nên chọn size lớn hơn 1 số.');
    },
    
    addToCart() {
      if (!this.selectedSize) {
        alert('Vui lòng chọn size!');
        return;
      }
      
      if (!this.selectedColor) {
        alert('Vui lòng chọn màu sắc!');
        return;
      }
      
      if (this.currentStock === 0) {
        alert('Sản phẩm đã hết hàng!');
        return;
      }
      
      const cartItem = {
        productId: this.currentVariant?.id || this.product.id,
        productDetailId: this.currentVariant?.id,
        name: this.product.sanPham?.tenSanPham,
        price: this.currentPrice,
        quantity: this.quantity,
        totalPrice: this.totalPrice,
        color: {
          id: this.selectedColor.id,
          name: this.selectedColor.tenMauSac,
          code: this.selectedColor.maMauSac
        },
        size: {
          id: this.selectedSize.id,
          name: this.selectedSize.tenKichCo
        },
        image: this.selectedImage,
        stock: this.currentStock
      };
      
      // Get existing cart from localStorage
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Check if item already exists in cart
      const existingIndex = cart.findIndex(item => 
        item.productDetailId === cartItem.productDetailId
      );
      
      if (existingIndex > -1) {
        // Update quantity if item exists
        cart[existingIndex].quantity += this.quantity;
        cart[existingIndex].totalPrice = cart[existingIndex].price * cart[existingIndex].quantity;
      } else {
        // Add new item
        cart.push(cartItem);
      }
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(cart));
      
      console.log('Added to cart:', cartItem);
      alert(`Đã thêm ${this.quantity} sản phẩm vào giỏ hàng!`);
    },
    
    buyNow() {
      this.addToCart();
      this.$router.push('/checkout');
    }
  },
  
  mounted() {
    this.fetchProductDetail();
    // Fetch all sizes and colors from API
    this.fetchAllSizes();
    this.fetchAllColors();
  }
};
</script><style scoped>
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

.text-danger {
  color: #dc3545;
}

.price-section {
  margin-bottom: 30px;
  padding: 20px 0;
  border-top: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
}

.current-price {
  font-size: 32px;
  font-weight: bold;
  color: #ff6b35;
}

.original-price {
  font-size: 20px;
  color: #999;
  text-decoration: line-through;
}

.unit-price {
  font-size: 14px;
  color: #666;
  font-style: italic;
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
  padding: 8px 12px;
  margin: 4px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
}

.size-button.selected {
  background: #222;
  color: white;
}

.size-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-option {
  display: inline-block;
  margin: 5px;
  cursor: pointer;
}

.color-option.selected .color-swatch {
  border: 2px solid black;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #ccc;
}


.color-name {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.selected-variant-info {
  background: #f0f8ff;
  border: 1px solid #d0e4ff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.variant-details p {
  margin: 5px 0;
  font-size: 14px;
  color: #333;
}

.variant-details strong {
  color: #007bff;
}

.purchase-section {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 30px;
  padding: 20px 0;
  border-top: 1px solid #e9ecef;
  flex-wrap: wrap;
}

.quantity-wrapper {
  display: flex;
  align-items: center;
  gap: 15px;
}

.quantity-label {
  font-weight: bold;
  color: #333;
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

.qty-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qty-input {
  width: 70px;
  height: 45px;
  border: none;
  text-align: center;
  font-weight: bold;
  font-size: 16px;
}

.stock-warning {
  color: #ff6b35;
  font-size: 12px;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex: 1;
  min-width: 300px;
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

.btn-add-cart:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-2px);
}

.btn-buy-now {
  background: #ff6b35;
  color: white;
}

.btn-buy-now:hover:not(:disabled) {
  background: #e55a2b;
  transform: translateY(-2px);
}

.btn-add-cart:disabled, .btn-buy-now:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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