<template>
  <div class="product-detail-container">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <div class="container">
        <router-link to="/">Trang chủ</router-link>
        <span class="separator">›</span>
        <router-link :to="`/category/${product.danhMuc?.id}`">{{ product.danhMuc?.tenDanhMuc || 'Giày' }}</router-link>
        <span class="separator">›</span>
        <span class="current">{{ product.sanPham?.tenSanPham || 'Đang tải...' }}</span>
      </div>
    </div>

    <!-- Main Product Section -->
    <div class="container" v-if="product.sanPham">
      <div class="product-main">
        <!-- Product Images -->
        <div class="product-images">
          <div class="main-image">
            <img :src="selectedImage || '/placeholder-shoe.png'" :alt="product.sanPham.tenSanPham" />
            <div class="image-dots">
              <span 
                v-for="(img, index) in productImages" 
                :key="index"
                class="dot"
                :class="{ active: selectedImageIndex === index }"
                @click="selectImage(index)"
              ></span>
            </div>
          </div>
          
          <div class="thumbnail-list">
            <div 
              v-for="(img, index) in productImages" 
              :key="index"
              class="thumbnail"
              :class="{ active: selectedImageIndex === index }"
              @click="selectImage(index)"
            >
              <img :src="img" :alt="`${product.sanPham.tenSanPham} ${index + 1}`" />
              <div v-if="index === 0" class="video-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Product Info -->
        <div class="product-info">
          <div class="product-header">
            <span class="brand-badge">Mall</span>
            <h1 class="product-title">{{ product.sanPham.tenSanPham }}</h1>
            
            <div class="product-meta">
              <div class="rating">
                <span class="rating-value">{{ product.rating || '4.8' }}</span>
                <div class="stars">
                  <span v-for="i in 5" :key="i" class="star filled">★</span>
                </div>
              </div>
              <div class="separator">|</div>
              <span class="review-count">{{ product.reviewCount || '1.3k' }} Đánh Giá</span>
              <div class="separator">|</div>
              <span class="sold-count">Đã Bán {{ product.soldCount || '4k+' }}</span>
              <span class="report-link">Tố cáo</span>
            </div>
          </div>

          <!-- Flash Sale Section -->
          <div class="flash-sale-section">
            <div class="flash-sale-header">
              <span class="flash-badge">FLASH SALE</span>
              <span class="countdown-label">KẾT THÚC TRONG</span>
              <div class="countdown-timer">
                <span class="time-box">{{ hours }}</span>
                <span class="separator">:</span>
                <span class="time-box">{{ minutes }}</span>
                <span class="separator">:</span>
                <span class="time-box">{{ seconds }}</span>
              </div>
            </div>
          </div>

          <!-- Price Section -->
          <div class="price-section">
            <div class="price-row">
              <span class="currency">₫</span>
              <span class="current-price">{{ formatPrice(product.giaBan) }}</span>
              <span class="original-price">₫{{ formatPrice(product.giaGoc || product.giaBan * 1.5) }}</span>
              <span class="discount-badge">{{ discountPercent }}% GIẢM</span>
            </div>
          </div>

          <!-- Shipping Info -->
          <div class="info-section">
            <div class="info-row">
              <span class="label">Vận Chuyển</span>
              <div class="content">
                <div class="shipping-options">
                  <img src="data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='%2326aa99'%3E%3Cpath d='M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4.48L19 10.35V7zM7 17c-.55 0-1-.45-1-1h2c0 .55-.45 1-1 1z'/%3E%3C/svg%3E" alt="shipping" class="shipping-icon" />
                  <div class="shipping-text">
                    <div>Miễn phí vận chuyển</div>
                    <div class="shipping-time">Vận Chuyển tới <span class="location">Phường Trung Văn...</span></div>
                    <div class="shipping-fee">Phí vận chuyển <span class="fee">₫0</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Voucher Info -->
          <div class="voucher-section">
            <span class="label">Mã Giảm Giá</span>
            <div class="voucher-content">
              <span class="voucher-text">Giảm ₫15k</span>
              <button class="view-more">Xem Thêm</button>
            </div>
          </div>

          <!-- Shop Benefits -->
          <div class="benefits-section">
            <div class="shop-name">An Tâm Mua Sắm Cùng Shopee</div>
            <div class="benefits-list">
              <div class="benefit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#d0011b">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
                <span>Trả hàng miễn phí 15 ngày</span>
              </div>
              <div class="benefit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#d0011b">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Chính hãng 100%</span>
              </div>
              <div class="benefit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#d0011b">
                  <path d="M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4.48L19 10.35V7z"/>
                </svg>
                <span>Miễn phí vận chuyển</span>
              </div>
            </div>
          </div>

          <!-- Product Options -->
          <div class="product-options">
            <!-- Color Selection -->
            <div class="option-group" v-if="colors.length > 0">
              <label class="option-label">Màu Sắc</label>
              <div class="color-options">
                <button 
                  v-for="color in colors" 
                  :key="color.id"
                  class="color-option"
                  :class="{ selected: selectedColor?.id === color.id }"
                  @click="selectColor(color)"
                >
                  <img :src="color.image || '/placeholder-shoe.png'" :alt="color.tenMauSac" />
                  <span>{{ color.tenMauSac }}</span>
                </button>
              </div>
            </div>

            <!-- Size Selection -->
            <div class="option-group" v-if="sizes.length > 0">
              <label class="option-label">Size</label>
              <div class="size-options">
                <button 
                  v-for="size in sizes" 
                  :key="size.id"
                  class="size-option"
                  :class="{ selected: selectedSize?.id === size.id, disabled: !isSizeAvailable(size) }"
                  @click="selectSize(size)"
                  :disabled="!isSizeAvailable(size)"
                >
                  {{ size.tenKichCo }}
                </button>
              </div>
            </div>

            <!-- Quantity Selection -->
            <div class="option-group">
              <label class="option-label">Số Lượng</label>
              <div class="quantity-section">
                <div class="quantity-selector">
                  <button @click="decreaseQuantity" class="qty-btn" :disabled="quantity <= 1">-</button>
                  <input type="text" v-model.number="quantity" class="qty-input" @input="validateQuantity" />
                  <button @click="increaseQuantity" class="qty-btn" :disabled="quantity >= maxQuantity">+</button>
                </div>
                <span class="stock-info">{{ stockText }} sản phẩm có sẵn</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button class="add-to-cart-btn" @click="addToCart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
              Thêm Vào Giỏ Hàng
            </button>
            <button class="buy-now-btn" @click="buyNow">Mua Ngay</button>
          </div>

          <!-- Guarantee Section -->
          <div class="guarantee-section">
            <div class="guarantee-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ee4d2d">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              <span>Shopee Đảm Bảo</span>
            </div>
            <div class="guarantee-text">3 Ngày Trả Hàng / Hoàn Tiền</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading-container">
      <div class="loading-spinner"></div>
      <p>Đang tải thông tin sản phẩm...</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Product',
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
      countdown: {
        hours: '01',
        minutes: '49',
        seconds: '43'
      }
    };
  },
  computed: {
    productId() {
      return this.$route.params.id || this.$route.query.id;
    },
    selectedImage() {
      return this.productImages[this.selectedImageIndex] || '/placeholder-shoe.png';
    },
    hours() {
      return this.countdown.hours;
    },
    minutes() {
      return this.countdown.minutes;
    },
    seconds() {
      return this.countdown.seconds;
    },
    discountPercent() {
      if (this.product.giaGoc && this.product.giaBan) {
        return Math.round((1 - this.product.giaBan / this.product.giaGoc) * 100);
      }
      return 33; // Default discount
    },
    maxQuantity() {
      return this.product.soLuong || 99;
    },
    stockText() {
      return this.product.soLuong || 'Nhiều';
    }
  },
  methods: {
    async fetchProductDetail() {
      try {
        // Fetch product detail
        const response = await axios.get(`http://localhost:8080/api/san-pham-chi-tiet/${this.productId}`);
        this.product = response.data;
        
        // Set default images
        if (this.product.hinhAnh?.duongDan) {
          this.productImages = [this.product.hinhAnh.duongDan];
        } else {
          // Use placeholder images
          this.productImages = [
            '/placeholder-shoe.png',
            '/placeholder-shoe-2.png',
            '/placeholder-shoe-3.png',
            '/placeholder-shoe-4.png',
            '/placeholder-shoe-5.png'
          ];
        }
        
        // Fetch related data
        await this.fetchVariants();
      } catch (error) {
        console.error('Error fetching product detail:', error);
      }
    },
    
    async fetchVariants() {
      try {
        // Fetch all data in parallel
        const [variantsResponse, colorsResponse, sizesResponse] = await Promise.all([
          axios.get('http://localhost:8080/api/san-pham-chi-tiet'),
          axios.get('http://localhost:8080/mau-sac'),
          axios.get('http://localhost:8080/api/kich-co')
        ]);
        
        const allVariants = variantsResponse.data;
        const allColors = colorsResponse.data;
        const allSizes = sizesResponse.data;
        
        // Filter variants for this product
        this.availableVariants = allVariants.filter(v => 
          v.sanPham?.id === this.product.sanPham?.id
        );
        
        // Get unique color and size IDs from variants
        const colorIds = new Set();
        const sizeIds = new Set();
        
        this.availableVariants.forEach(variant => {
          if (variant.mauSac?.id) {
            colorIds.add(variant.mauSac.id);
          }
          if (variant.kichCo?.id) {
            sizeIds.add(variant.kichCo.id);
          }
        });
        
        // Filter colors and sizes that are available for this product
        this.colors = allColors.filter(color => 
          colorIds.has(color.id) && color.trangThai === 1
        );
        
        this.sizes = allSizes.filter(size => 
          sizeIds.has(size.id) && size.trangThai === 1
        ).sort((a, b) => {
          // Sort sizes numerically
          const aNum = parseInt(a.tenKichCo);
          const bNum = parseInt(b.tenKichCo);
          return aNum - bNum;
        });
        
        // Add image URLs for colors based on variants
        this.colors = this.colors.map(color => {
          const variantWithColor = this.availableVariants.find(v => 
            v.mauSac?.id === color.id && v.hinhAnh?.duongDan
          );
          return {
            ...color,
            image: variantWithColor?.hinhAnh?.duongDan || null
          };
        });
        
        // Set default selections
        if (this.product.mauSac) {
          this.selectedColor = this.colors.find(c => c.id === this.product.mauSac.id) || this.colors[0];
        } else if (this.colors.length > 0) {
          this.selectedColor = this.colors[0];
        }
        
        if (this.product.kichCo) {
          this.selectedSize = this.sizes.find(s => s.id === this.product.kichCo.id) || this.sizes[0];
        } else if (this.sizes.length > 0) {
          this.selectedSize = this.sizes[0];
        }
        
        // Update product images based on selected color
        this.updateProductImages();
        
      } catch (error) {
        console.error('Error fetching variants:', error);
        // Show error message to user
        this.$toast?.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin sản phẩm',
          life: 3000
        });
      }
    },
    
    selectImage(index) {
      this.selectedImageIndex = index;
    },
    
    selectColor(color) {
      this.selectedColor = color;
      this.updateSelectedVariant();
      this.updateProductImages();
    },
    
    selectSize(size) {
      if (this.isSizeAvailable(size)) {
        this.selectedSize = size;
        this.updateSelectedVariant();
      }
    },
    
    isSizeAvailable(size) {
      if (!this.selectedColor) return true;
      
      return this.availableVariants.some(v => 
        v.mauSac?.id === this.selectedColor.id && 
        v.kichCo?.id === size.id && 
        v.soLuong > 0
      );
    },
    
    updateSelectedVariant() {
      if (this.selectedColor && this.selectedSize) {
        const variant = this.availableVariants.find(v => 
          v.mauSac?.id === this.selectedColor.id && 
          v.kichCo?.id === this.selectedSize.id
        );
        
        if (variant) {
          // Update product info with the selected variant
          this.product = { 
            ...this.product, 
            ...variant,
            // Keep original product info
            sanPham: this.product.sanPham,
            danhMuc: this.product.danhMuc
          };
        }
      }
    },
    
    updateProductImages() {
      if (!this.selectedColor) return;
      
      // Find all variants with the selected color
      const variantsWithColor = this.availableVariants.filter(v => 
        v.mauSac?.id === this.selectedColor.id && v.hinhAnh?.duongDan
      );
      
      if (variantsWithColor.length > 0) {
        // Get unique images
        const uniqueImages = [...new Set(variantsWithColor.map(v => v.hinhAnh.duongDan))];
        this.productImages = uniqueImages.length > 0 ? uniqueImages : ['/placeholder-shoe.png'];
        this.selectedImageIndex = 0;
      } else {
        // Use placeholder if no images found
        this.productImages = ['/placeholder-shoe.png'];
      }
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
    
    formatPrice(price) {
      if (!price) return '0';
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },
    
    addToCart() {
      // Validate selections
      if (!this.selectedColor || !this.selectedSize) {
        alert('Vui lòng chọn màu sắc và kích cỡ!');
        return;
      }
      
      // Check stock
      if (this.quantity > this.maxQuantity) {
        alert('Số lượng vượt quá hàng có sẵn!');
        return;
      }
      
      // Add to cart logic
      const cartItem = {
        productId: this.product.id,
        name: this.product.sanPham?.tenSanPham,
        price: this.product.giaBan,
        quantity: this.quantity,
        color: this.selectedColor,
        size: this.selectedSize,
        image: this.selectedImage,
        maxQuantity: this.product.soLuong
      };
      
      // Get existing cart from localStorage
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Check if item already exists
      const existingItemIndex = cart.findIndex(item => 
        item.productId === cartItem.productId &&
        item.color.id === cartItem.color.id &&
        item.size.id === cartItem.size.id
      );
      
      if (existingItemIndex > -1) {
        // Update quantity
        cart[existingItemIndex].quantity += this.quantity;
      } else {
        // Add new item
        cart.push(cartItem);
      }
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(cart));
      
      console.log('Added to cart:', cartItem);
      
      // Show success message
      this.$toast?.add({
        severity: 'success',
        summary: 'Thành công',
        detail: `Đã thêm ${this.quantity} sản phẩm vào giỏ hàng!`,
        life: 3000
      }) || alert('Đã thêm vào giỏ hàng!');
      
      // Emit event for cart update
      this.$emit('cart-updated', cart);
    },
    
    buyNow() {
      // Buy now logic
      this.addToCart();
      this.$router.push('/checkout');
    },
    
    startCountdown() {
      setInterval(() => {
        // Simple countdown logic
        let seconds = parseInt(this.countdown.seconds);
        let minutes = parseInt(this.countdown.minutes);
        let hours = parseInt(this.countdown.hours);
        
        seconds--;
        
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        
        if (hours < 0) {
          hours = 23;
        }
        
        this.countdown = {
          hours: hours.toString().padStart(2, '0'),
          minutes: minutes.toString().padStart(2, '0'),
          seconds: seconds.toString().padStart(2, '0')
        };
      }, 1000);
    }
  },
  mounted() {
    this.fetchProductDetail();
    this.startCountdown();
  }
};
</script>

<style scoped>
/* General Styles */
.product-detail-container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Breadcrumb */
.breadcrumb {
  background: white;
  padding: 1rem 0;
  margin-bottom: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.breadcrumb .container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
}

.breadcrumb a {
  color: #05a;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb .separator {
  color: #999;
  margin: 0 0.5rem;
}

.breadcrumb .current {
  color: #666;
}

/* Main Product Layout */
.product-main {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  display: grid;
  grid-template-columns: 500px 1fr;
  gap: 3rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Product Images */
.product-images {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-image {
  position: relative;
  width: 100%;
  height: 500px;
  background: #f8f8f8;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
}

.main-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-dots {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: background 0.3s;
}

.dot.active {
  background: rgba(0, 0, 0, 0.8);
}

.thumbnail-list {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
}

.thumbnail {
  position: relative;
  min-width: 80px;
  height: 80px;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.3s;
}

.thumbnail.active {
  border-color: #ee4d2d;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Product Info */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.product-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 1rem;
}

.brand-badge {
  display: inline-block;
  background: #ee4d2d;
  color: white;
  padding: 0.25rem 0.5rem;
  font-size: 12px;
  border-radius: 2px;
  margin-bottom: 0.5rem;
}

.product-title {
  font-size: 20px;
  font-weight: 400;
  color: #333;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 14px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-value {
  color: #ee4d2d;
  font-weight: 500;
  text-decoration: underline;
}

.stars {
  display: flex;
  gap: 1px;
}

.star {
  color: #ee4d2d;
  font-size: 12px;
}

.star.filled {
  color: #ee4d2d;
}

.product-meta .separator {
  color: #ddd;
}

.review-count,
.sold-count {
  color: #666;
}

.report-link {
  margin-left: auto;
  color: #999;
  font-size: 12px;
  cursor: pointer;
}

/* Flash Sale Section */
.flash-sale-section {
  background: #fff5f5;
  padding: 1rem;
  border-radius: 4px;
}

.flash-sale-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.flash-badge {
  background: #ee4d2d;
  color: white;
  padding: 0.25rem 0.75rem;
  font-size: 14px;
  font-weight: 500;
  border-radius: 2px;
}

.countdown-label {
  color: #666;
  font-size: 14px;
}

.countdown-timer {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
}

.time-box {
  background: #333;
  color: white;
  padding: 0.25rem 0.5rem;
  font-size: 14px;
  font-weight: 500;
  border-radius: 2px;
  min-width: 28px;
  text-align: center;
}

.countdown-timer .separator {
  color: #333;
  font-weight: bold;
}

/* Price Section */
.price-section {
  background: #fafafa;
  padding: 1.5rem;
  border-radius: 4px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.currency {
  font-size: 14px;
  color: #ee4d2d;
}

.current-price {
  font-size: 30px;
  color: #ee4d2d;
  font-weight: 500;
}

.original-price {
  font-size: 16px;
  color: #999;
  text-decoration: line-through;
}

.discount-badge {
  background: #ee4d2d;
  color: white;
  padding: 0.25rem 0.5rem;
  font-size: 12px;
  border-radius: 2px;
  font-weight: 500;
}

/* Info Sections */
.info-section,
.voucher-section {
  display: flex;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row {
  display: flex;
  width: 100%;
}

.label {
  width: 120px;
  color: #757575;
  font-size: 14px;
}

.content {
  flex: 1;
}

.shipping-options {
  display: flex;
  gap: 1rem;
}

.shipping-icon {
  width: 24px;
  height: 24px;
}

.shipping-text {
  font-size: 14px;
}

.shipping-time {
  color: #666;
  margin-top: 0.5rem;
}

.location {
  color: #333;
  font-weight: 500;
}

.shipping-fee {
  margin-top: 0.5rem;
}

.fee {
  color: #ee4d2d;
  font-weight: 500;
}

/* Voucher Section */
.voucher-section {
  align-items: center;
}

.voucher-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.voucher-text {
  background: #fff0f0;
  color: #ee4d2d;
  padding: 0.25rem 0.5rem;
  font-size: 12px;
  border-radius: 2px;
}

.view-more {
  color: #05a;
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
}

/* Benefits Section */
.benefits-section {
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.shop-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.benefits-list {
  display: flex;
  gap: 2rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
  color: #666;
}

.benefit-item svg {
  flex-shrink: 0;
}

/* Product Options */
.product-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.option-group {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.option-label {
  width: 120px;
  color: #757575;
  font-size: 14px;
  padding-top: 0.5rem;
}

/* Color Options */
.color-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-option {
  border: 2px solid transparent;
  background: #f8f8f8;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 80px;
}

.color-option:hover {
  border-color: #ee4d2d;
}

.color-option.selected {
  border-color: #ee4d2d;
}

.color-option img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.color-option span {
  font-size: 12px;
  color: #333;
}

/* Size Options */
.size-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.size-option {
  min-width: 80px;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.size-option:hover:not(.disabled) {
  border-color: #ee4d2d;
}

.size-option.selected {
  border-color: #ee4d2d;
  color: #ee4d2d;
}

.size-option.disabled {
  background: #f5f5f5;
  color: #ccc;
  cursor: not-allowed;
}

/* Quantity Section */
.quantity-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quantity-selector {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: white;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.qty-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.qty-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.qty-input {
  width: 50px;
  height: 32px;
  border: none;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  text-align: center;
  font-size: 14px;
}

.qty-input:focus {
  outline: none;
}

.stock-info {
  font-size: 14px;
  color: #666;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.add-to-cart-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1px solid #ee4d2d;
  color: #ee4d2d;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.add-to-cart-btn:hover {
  background: #fff5f5;
}

.buy-now-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  background: #ee4d2d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.buy-now-btn:hover {
  background: #d73211;
}

/* Guarantee Section */
.guarantee-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
  font-size: 14px;
}

.guarantee-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
}

.guarantee-text {
  color: #666;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  background: white;
  border-radius: 8px;
  margin: 2rem auto;
  max-width: 1200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #ee4d2d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  margin-top: 1rem;
  color: #666;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .product-main {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .main-image {
    height: 400px;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 0.5rem;
  }
  
  .product-main {
    padding: 1rem;
  }
  
  .main-image {
    height: 300px;
  }
  
  .product-meta {
    flex-wrap: wrap;
  }
  
  .report-link {
    margin-left: 0;
    width: 100%;
    margin-top: 0.5rem;
  }
  
  .price-row {
    flex-wrap: wrap;
  }
  
  .current-price {
    font-size: 24px;
  }
  
  .option-group {
    flex-direction: column;
  }
  
  .option-label {
    width: auto;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .benefits-list {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Custom scrollbar for thumbnails */
.thumbnail-list::-webkit-scrollbar {
  height: 6px;
}

.thumbnail-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.thumbnail-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.thumbnail-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>