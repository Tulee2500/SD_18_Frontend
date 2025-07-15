<template>
  <div class="product-detail-container">
    <!-- Navigation -->
    <Nav />
    
    <!-- Main Product Content -->
    <div class="product-main">
      <div class="container" v-if="product.sanPham && !loadingMainProduct">
        <div class="product-wrapper">
          <!-- Left Side - Product Images (aside) -->
          <aside class="product-gallery">
            <!-- Thumbnail Gallery -->
            
               
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
              <h3 class="section-title">TẠI SAO KHÁCH HÀNG LỰA CH��N MYSHOES?</h3>
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

      <!-- Loading State for Main Product -->
      <div v-else-if="loadingMainProduct" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Đang tải thông tin sản phẩm...</p>
      </div>

      <!-- Error State -->
      <div v-else class="loading-container">
        <div class="loading-spinner"></div>
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    </div>

    <!-- Similar Products Section -->
    <div class="similar-products-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Sản phẩm tương tự</h2>
          <p class="section-description">Khám phá thêm những sản phẩm chất lượng khác</p>
        </div>

        <!-- Loading State for Similar Products -->
        <div v-if="loadingSimilarProducts" class="similar-products-grid">
          <div v-for="n in 8" :key="n" class="similar-product-skeleton">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-price"></div>
            </div>
          </div>
        </div>

        <!-- Similar Products Grid -->
        <div v-else class="similar-products-grid">
          <div 
            v-for="(similarProduct, index) in similarProducts"
            :key="similarProduct.id"
            @click="goToProduct(similarProduct)"
            class="similar-product-card"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <!-- Product Image -->
            <div class="similar-product-image-container">
              <img 
                v-if="similarProduct.imgUrl"
                :src="similarProduct.imgUrl"
                :alt="similarProduct.label"
                class="similar-product-image"
                @error="handleImageError"
              />
              <div v-else class="similar-product-placeholder">
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
              
              <!-- Product Badge -->
              <div class="similar-product-badge">
                <span>Mới</span>
              </div>
              
              <!-- Hover Overlay -->
              <div class="similar-product-overlay">
                <div class="quick-view-btn">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Product Info -->
            <div class="similar-product-info">
              <!-- Rating -->
              <div class="similar-product-rating">
                <div class="stars">
                  <span
                    v-for="i in 5"
                    :key="i"
                    class="star"
                    :class="{ filled: i <= Math.floor(similarProduct.rating) }"
                  >
                    ★
                  </span>
                </div>
                <span class="rating-value">({{ similarProduct.rating }})</span>
              </div>
              
              <!-- Product Name -->
              <h3 class="similar-product-name">{{ similarProduct.label }}</h3>
              
              <!-- Product Price -->
              <div class="similar-price-container">
                <p class="similar-product-price">₫{{ formatPrice(similarProduct.price) }}</p>
                <p class="similar-price-label">Giá tốt nhất</p>
              </div>
              
              <!-- Add to Cart Button -->
              <button class="similar-add-to-cart-btn" @click.stop="addSimilarToCart(similarProduct)">
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

        <!-- View All Products Button -->
        <div class="view-all-section">
          <button @click="goToProductList" class="view-all-btn">
            <span>Xem tất cả sản phẩm</span>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </button>
        </div>
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
      selectedSizes: [],
      quantity: 1,
      colors: [],
      sizes: [],
      availableVariants: [],
      currentVariant: null,
      brandLogo: '/lacoste-logo.png',
      // Similar products data
      similarProducts: [],
      loadingSimilarProducts: true,
      loadingMainProduct: false,
    };
  },
  components: {
    Nav, 
    Footer,
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
  watch: {
    '$route.params.id': {
      handler(newId, oldId) {
        if (newId && newId !== oldId) {
          // Reset data when navigating to new product
          this.resetProductData();
          // Fetch new product data
          this.fetchProductDetail();
          this.fetchAllSizes();
          this.fetchAllColors();
        }
      },
      immediate: false
    }
  },
  
  methods: {
    resetProductData() {
      this.product = {};
      this.productImages = [];
      this.selectedImageIndex = 0;
      this.selectedColor = null;
      this.selectedSizes = [];
      this.quantity = 1;
      this.colors = [];
      this.sizes = [];
      this.availableVariants = [];
      this.currentVariant = null;
      this.similarProducts = [];
      this.loadingSimilarProducts = true;
      
      // Scroll to top when navigating to new product
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    async fetchProductDetail() {
      try {
        this.loadingMainProduct = true;
        const response = await axios.get(`http://localhost:8080/api/san-pham-chi-tiet/${this.productId}`);
        this.product = response.data;
        
        // Set product images
        if (this.product.hinhAnh?.duongDan) {
          this.productImages = [
            this.product.hinhAnh.duongDan,
            this.product.hinhAnh.duongDan,
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
        await this.fetchSimilarProducts();
      } catch (error) {
        console.error('Error fetching product:', error);
        alert('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
      } finally {
        this.loadingMainProduct = false;
      }
    },

    async fetchSimilarProducts() {
      try {
        this.loadingSimilarProducts = true;
        const response = await axios.get('http://localhost:8080/api/san-pham-chi-tiet');
        
        // Map data similar to ProductList component
        const allProducts = response.data.map(p => ({
          id: p.id,
          imgUrl: p.hinhAnh?.duongDan ?? '',
          label: p.sanPham?.tenSanPham ?? '',
          price: p.giaBan,
          rating: 4.8,
          colorId: p.mauSac?.id,
          sizeId: p.kichCo?.id,
          productId: p.sanPham?.id,
          categoryId: p.sanPham?.danhMuc?.id
        }));

        // Filter out current product and get similar products
        let filteredProducts = allProducts.filter(p => p.id !== parseInt(this.productId));
        
        // Try to get products from same category first
        const currentCategoryId = this.product.sanPham?.danhMuc?.id;
        if (currentCategoryId) {
          const sameCategoryProducts = filteredProducts.filter(p => p.categoryId === currentCategoryId);
          if (sameCategoryProducts.length >= 8) {
            this.similarProducts = sameCategoryProducts.slice(0, 8);
          } else {
            // If not enough products in same category, mix with other products
            const otherProducts = filteredProducts.filter(p => p.categoryId !== currentCategoryId);
            this.similarProducts = [
              ...sameCategoryProducts,
              ...otherProducts.slice(0, 8 - sameCategoryProducts.length)
            ];
          }
        } else {
          // If no category info, just get first 8 products
          this.similarProducts = filteredProducts.slice(0, 8);
        }

      } catch (error) {
        console.error('Error fetching similar products:', error);
        this.similarProducts = [];
      } finally {
        this.loadingSimilarProducts = false;
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
        this.sizes = res.data
          .filter(size => size.trangThai === 1)
          .sort((a, b) => parseFloat(a.tenKichCo) - parseFloat(b.tenKichCo));
      } catch (err) {
        console.error('Lỗi khi tải kích cỡ:', err);
      }
    },

    async fetchAllColors() {
      try {
        const res = await axios.get('http://localhost:8080/mau-sac');
        this.colors = res.data;
      } catch (err) {
        console.error('Lỗi khi tải màu sắc:', err);
      }
    },

    goToProduct(product) {
      // Navigate to the product detail page
      this.$router.push({
        name: 'product-detail', // hoặc tên route bạn đã định nghĩa
        params: { id: product.id }
      });
    },

    goToProductList() {
      this.$router.push({ name: 'products' });
    },

    addSimilarToCart(product) {
      console.log('Added similar product to cart:', product);
      alert(`Đã thêm ${product.label} vào giỏ hàng!`);
    },

    handleImageError(event) {
      event.target.style.display = 'none';
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

    selectImage(index) {
      this.selectedImageIndex = index;
    },

    selectColor(color) {
      this.selectedColor = color;
      this.updateProductVariant();
      this.quantity = 1;
      
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
        this.selectedSizes.splice(index, 1);
      } else {
        this.selectedSizes.push(size);
      }
      
      if (this.selectedSizes.length > 0) {
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
      if (this.selectedColor && this.selectedSizes.length > 0) {
        const variant = this.getVariant(this.selectedColor, this.selectedSizes[0]);
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
      if (this.selectedSizes.length === 0) {
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
          id: this.selectedSizes[0].id,
          name: this.selectedSizes[0].tenKichCo
        },
        image: this.selectedImage,
        stock: this.currentStock
      };
      
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingIndex = cart.findIndex(item => 
        item.productDetailId === cartItem.productDetailId
      );
      
      if (existingIndex > -1) {
        cart[existingIndex].quantity += this.quantity;
        cart[existingIndex].totalPrice = cart[existingIndex].price * cart[existingIndex].quantity;
      } else {
        cart.push(cartItem);
      }
      
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
    this.fetchAllSizes();
    this.fetchAllColors();
  }
};
</script>

<style scoped>
/* Keep all your existing styles */
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
  transition: all 0.3s ease;
}

.color-option:hover {
  background: #f8f9fa;
}

.color-option.selected {
  background: #e3f2fd;
  border: 2px solid #2196f3;
}

.color-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #ddd;
  transition: all 0.3s ease;
}

.color-option.selected .color-circle {
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.color-name {
  font-size: 12px;
  color: #666;
  text-align: center;
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

/* Similar Products Section Styles */
.similar-products-section {
  background: #f8f9fa;
  padding: 80px 0;
  margin-top: 60px;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header .section-title {
  font-size: 2.5rem;
  font-weight: 900;
  color: #1a202c;
  margin-bottom: 15px;
  text-transform: uppercase;
}

.section-description {
  color: #64748b;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.similar-products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  margin-bottom: 60px;
}

.similar-product-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  animation: slideUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
}

.similar-product-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.similar-product-card:hover .similar-product-image {
  transform: scale(1.1);
}

.similar-product-card:hover .similar-product-overlay {
  opacity: 1;
}

.similar-product-image-container {
  position: relative;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 220px;
  overflow: hidden;
}

.similar-product-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.similar-product-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
}

.placeholder-icon {
  width: 100px;
  height: 60px;
  opacity: 0.6;
}

.similar-product-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background: linear-gradient(135deg, #FF6452, #ff8a80);
  color: white;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(255, 100, 82, 0.4);
  z-index: 2;
}

.similar-product-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 100, 82, 0.9), rgba(255, 138, 128, 0.9));
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: all 0.3s ease;
}

.quick-view-btn {
  background: white;
  color: #FF6452;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  transform: scale(0.8);
  transition: all 0.3s ease;
  cursor: pointer;
}

.quick-view-btn svg {
  width: 20px;
  height: 20px;
}

.quick-view-btn:hover {
  transform: scale(1);
}

.similar-product-info {
  padding: 25px;
}

.similar-product-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.similar-product-rating .stars {
  display: flex;
  gap: 2px;
}

.similar-product-rating .star {
  color: #e2e8f0;
  font-size: 14px;
  transition: all 0.2s ease;
}

.similar-product-rating .star.filled {
  color: #fbbf24;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
}

.rating-value {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
}

.similar-product-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1a202c;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.similar-price-container {
  margin-bottom: 20px;
}

.similar-product-price {
  font-size: 1.4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #FF6452, #ff8a80);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
}

.similar-price-label {
  font-size: 0.7rem;
  color: #10b981;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.similar-add-to-cart-btn {
  position: relative;
  width: 100%;
  background: transparent;
  border: 2px solid #FF6452;
  color: #FF6452;
  padding: 12px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}

.similar-add-to-cart-btn .btn-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 2;
  transition: all 0.3s ease;
}

.similar-add-to-cart-btn .cart-icon {
  width: 16px;
  height: 16px;
  transition: all 0.3s ease;
}

.similar-add-to-cart-btn .btn-text {
  font-size: 0.9rem;
}

.similar-add-to-cart-btn .btn-background {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #FF6452, #ff8a80);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
  z-index: 1;
}

.similar-add-to-cart-btn:hover {
  color: white;
  border-color: #FF6452;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 100, 82, 0.3);
}

.similar-add-to-cart-btn:hover .btn-background {
  transform: scaleX(1);
}

.similar-add-to-cart-btn:hover .cart-icon {
  transform: scale(1.1);
}

/* Loading Skeleton for Similar Products */
.similar-product-skeleton {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.skeleton-image {
  height: 220px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

.skeleton-content {
  padding: 25px;
}

.skeleton-line {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
  border-radius: 8px;
  margin-bottom: 12px;
}

.skeleton-title {
  width: 80%;
  height: 20px;
}

.skeleton-price {
  width: 60%;
  height: 24px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* View All Section */
.view-all-section {
  text-align: center;
  margin-top: 40px;
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #FF6452, #ff8a80);
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(255, 100, 82, 0.3);
}

.view-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(255, 100, 82, 0.4);
}

.view-all-btn svg {
  width: 20px;
  height: 20px;
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .similar-products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 25px;
  }
}

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
  
  .similar-products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .section-header .section-title {
    font-size: 2rem;
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
  
  .similar-products-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .section-header .section-title {
    font-size: 1.8rem;
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
  
  .similar-products-section {
    padding: 60px 0;
  }
  
  .section-header .section-title {
    font-size: 1.5rem;
  }
}
</style>
