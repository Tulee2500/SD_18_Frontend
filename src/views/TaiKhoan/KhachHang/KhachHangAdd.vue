<template>
  <div class="container-fluid py-4" style="background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%); min-height: 100vh;">
    <!-- Header Section -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex align-items-center mb-3">
          <div class="bg-success text-white rounded p-3 me-3" style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-user-plus"></i>
          </div>
          <div>
            <h2 class="mb-1 fw-bold">➕ Thêm Khách Hàng Mới</h2>
            <p class="text-muted mb-0">Điền thông tin để tạo khách hàng mới trong hệ thống</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Card -->
    <div class="row justify-content-center">
      <div class="col-lg-8 col-xl-6">
        <div class="card shadow-lg border-0">
          <!-- Card Header -->
          <div class="card-header text-white" style="background: linear-gradient(135deg, #007bff 0%, #6f42c1 100%);">
            <h4 class="card-title mb-0">
              <i class="fas fa-user-edit me-2"></i>
              Thông Tin Khách Hàng
            </h4>
            <small class="opacity-75">Vui lòng điền đầy đủ thông tin bên dưới</small>
          </div>

          <!-- Form Content -->
          <div class="card-body p-4">
            <form @submit.prevent="create">
              <!-- Row 1: Mã KH và Họ Tên -->
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">
                    <i class="fas fa-hashtag text-primary me-2"></i>
                    Mã Khách Hàng
                  </label>
                  <input 
                    type="text" 
                    v-model="form.maKhachHang" 
                    class="form-control form-control-lg"
                    :class="{ 'is-invalid': errors.maKhachHang }"
                    placeholder="Nhập mã khách hàng"
                    required 
                  />
                  <div v-if="errors.maKhachHang" class="invalid-feedback">
                    {{ errors.maKhachHang }}
                  </div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">
                    <i class="fas fa-user text-primary me-2"></i>
                    Họ và Tên
                  </label>
                  <input 
                    type="text" 
                    v-model="form.hoTen" 
                    class="form-control form-control-lg"
                    :class="{ 'is-invalid': errors.hoTen }"
                    placeholder="Nhập họ và tên"
                    required 
                  />
                  <div v-if="errors.hoTen" class="invalid-feedback">
                    {{ errors.hoTen }}
                  </div>
                </div>
              </div>

              <!-- Row 2: Email và SĐT -->
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">
                    <i class="fas fa-envelope text-primary me-2"></i>
                    Email
                  </label>
                  <input 
                    type="email" 
                    v-model="form.email" 
                    class="form-control form-control-lg"
                    :class="{ 'is-invalid': errors.email }"
                    placeholder="example@email.com"
                    required 
                  />
                  <div v-if="errors.email" class="invalid-feedback">
                    {{ errors.email }}
                  </div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">
                    <i class="fas fa-phone text-primary me-2"></i>
                    Số Điện Thoại
                  </label>
                  <input 
                    type="text" 
                    v-model="form.sdt" 
                    class="form-control form-control-lg"
                    :class="{ 'is-invalid': errors.sdt }"
                    placeholder="0123456789"
                    required 
                  />
                  <div v-if="errors.sdt" class="invalid-feedback">
                    {{ errors.sdt }}
                  </div>
                </div>
              </div>

              <!-- Trạng Thái -->
              <div class="mb-4">
                <label class="form-label fw-semibold">
                  <i class="fas fa-toggle-on text-primary me-2"></i>
                  Trạng Thái
                </label>
                <select 
                  v-model="form.trangThai" 
                  class="form-select form-select-lg"
                >
                  <option :value="1">
                    🟢 Hoạt động
                  </option>
                  <option :value="0">
                    🔴 Ngưng hoạt động
                  </option>
                </select>
              </div>

              <!-- Hidden fields -->
              <input type="hidden" v-model="form.viDiem" />
              <input type="hidden" v-model="form.taiKhoan" />
              <input type="hidden" v-model="form.diaChi" />

              <!-- Success Message -->
              <div v-if="showSuccess" class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Thành công!</strong> Khách hàng đã được thêm thành công!
                <button type="button" class="btn-close" @click="showSuccess = false"></button>
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                <strong>Lỗi!</strong> {{ errorMessage }}
                <button type="button" class="btn-close" @click="errorMessage = ''"></button>
              </div>

              <!-- Action Buttons -->
              <div class="d-grid gap-2 d-md-flex justify-content-md-end pt-3 border-top">
                <button 
                  type="submit" 
                  :disabled="isLoading"
                  class="btn btn-success btn-lg me-md-2"
                  style="min-width: 150px;"
                >
                  <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="fas fa-save me-2"></i>
                  {{ isLoading ? 'Đang lưu...' : 'Lưu Khách Hàng' }}
                </button>
                
                <router-link 
                  to="/khach-hang" 
                  class="btn btn-secondary btn-lg"
                  style="min-width: 120px;"
                >
                  <i class="fas fa-arrow-left me-2"></i>
                  Hủy Bỏ
                </router-link>
              </div>
            </form>
          </div>
        </div>

        <!-- Additional Info Card -->
        <div class="card mt-4 border-0 shadow-sm">
          <div class="card-body">
            <div class="row text-center">
              <div class="col-md-4">
                <div class="p-3">
                  <i class="fas fa-shield-alt fa-2x text-success mb-2"></i>
                  <h6 class="fw-bold">Bảo Mật</h6>
                  <small class="text-muted">Thông tin được mã hóa an toàn</small>
                </div>
              </div>
              <div class="col-md-4">
                <div class="p-3">
                  <i class="fas fa-clock fa-2x text-info mb-2"></i>
                  <h6 class="fw-bold">Nhanh Chóng</h6>
                  <small class="text-muted">Xử lý trong vài giây</small>
                </div>
              </div>
              <div class="col-md-4">
                <div class="p-3">
                  <i class="fas fa-sync-alt fa-2x text-warning mb-2"></i>
                  <h6 class="fw-bold">Đồng Bộ</h6>
                  <small class="text-muted">Cập nhật realtime</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'KhachHangAdd',
  data() {
    return {
      form: {
        maKhachHang: '',
        hoTen: '',
        email: '',
        sdt: '',
        trangThai: 1,
        viDiem: 1,
        taiKhoan: 1,
        diaChi: 1,
      },
      isLoading: false,
      showSuccess: false,
      errorMessage: '',
      errors: {}
    };
  },
  methods: {
    validateForm() {
      this.errors = {};
      
      // Validate Mã Khách Hàng
      if (!this.form.maKhachHang.trim()) {
        this.errors.maKhachHang = 'Mã khách hàng không được để trống';
      } else if (this.form.maKhachHang.length < 3) {
        this.errors.maKhachHang = 'Mã khách hàng phải có ít nhất 3 ký tự';
      }
      
      // Validate Họ Tên
      if (!this.form.hoTen.trim()) {
        this.errors.hoTen = 'Họ tên không được để trống';
      } else if (this.form.hoTen.length < 2) {
        this.errors.hoTen = 'Họ tên phải có ít nhất 2 ký tự';
      }
      
      // Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.form.email.trim()) {
        this.errors.email = 'Email không được để trống';
      } else if (!emailRegex.test(this.form.email)) {
        this.errors.email = 'Email không đúng định dạng';
      }
      
      // Validate SĐT
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!this.form.sdt.trim()) {
        this.errors.sdt = 'Số điện thoại không được để trống';
      } else if (!phoneRegex.test(this.form.sdt)) {
        this.errors.sdt = 'Số điện thoại phải có 10-11 chữ số';
      }
      
      return Object.keys(this.errors).length === 0;
    },

    async create() {
      // Validate form
      if (!this.validateForm()) {
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';
      this.showSuccess = false;

      try {
        await axios.post('http://localhost:8080/khach-hang', this.form);
        
        // Show success message
        this.showSuccess = true;
        
        // Reset form
        this.resetForm();
        
        // Redirect after 2 seconds
        setTimeout(() => {
          this.$router.push('/khach-hang');
        }, 2000);
        
      } catch (error) {
        console.error('Error creating customer:', error);
        
        if (error.response?.status === 400) {
          this.errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
        } else if (error.response?.status === 409) {
          this.errorMessage = 'Mã khách hàng hoặc email đã tồn tại.';
        } else {
          this.errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi thêm khách hàng. Vui lòng thử lại.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    resetForm() {
      this.form = {
        maKhachHang: '',
        hoTen: '',
        email: '',
        sdt: '',
        trangThai: 1,
        viDiem: 1,
        taiKhoan: 1,
        diaChi: 1,
      };
      this.errors = {};
    },

    // Auto-generate customer code
    generateCustomerCode() {
      const timestamp = Date.now().toString().slice(-6);
      this.form.maKhachHang = `KH${timestamp}`;
    }
  },

  mounted() {
    // Auto-generate customer code if empty
    if (!this.form.maKhachHang) {
      this.generateCustomerCode();
    }
  }
};
</script>

<style scoped>
.card {
  border-radius: 15px;
  overflow: hidden;
}

.card-header {
  border-bottom: none;
}

.form-control:focus,
.form-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.alert {
  border-radius: 10px;
  border: none;
}

.form-label {
  margin-bottom: 8px;
}

.invalid-feedback {
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .d-grid.gap-2.d-md-flex {
    display: grid !important;
  }
  
  .btn {
    width: 100%;
    margin-bottom: 10px;
  }
}

/* Custom animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>