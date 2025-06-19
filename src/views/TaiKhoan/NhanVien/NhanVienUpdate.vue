<template>
  <div class="container-fluid py-4" style="background: linear-gradient(135deg, #f8f9fa 0%, #e8f5e8 100%); min-height: 100vh;">
    <!-- Header Section -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex align-items-center mb-3">
          <div class="bg-success text-white rounded p-3 me-3" style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-user-edit"></i>
          </div>
          <div>
            <h2 class="mb-1 fw-bold">✏️ Cập Nhật Nhân Viên</h2>
            <p class="text-muted mb-0">Chỉnh sửa thông tin nhân viên trong hệ thống</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="row justify-content-center">
      <div class="col-lg-8 col-xl-6">
        <div class="card shadow-lg border-0">
          <div class="card-body text-center py-5">
            <div class="spinner-border text-success mb-3" role="status" style="width: 3rem; height: 3rem;">
              <span class="visually-hidden">Loading...</span>
            </div>
            <h5 class="text-muted">Đang tải thông tin nhân viên...</h5>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="row justify-content-center">
      <div class="col-lg-8 col-xl-6">
        <div class="card shadow-lg border-0">
          <div class="card-body text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
            <h5 class="text-danger mb-3">Không thể tải thông tin nhân viên</h5>
            <p class="text-muted mb-4">{{ loadError }}</p>
            <div class="d-flex gap-2 justify-content-center">
              <button @click="loadEmployeeData" class="btn btn-success">
                <i class="fas fa-redo me-2"></i>Thử lại
              </button>
              <router-link to="/nhan-vien" class="btn btn-secondary">
                <i class="fas fa-arrow-left me-2"></i>Quay lại
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Card -->
    <div v-else-if="form" class="row justify-content-center">
      <div class="col-lg-8 col-xl-6">
        <div class="card shadow-lg border-0">
          <!-- Card Header -->
          <div class="card-header text-white" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h4 class="card-title mb-0">
                  <i class="fas fa-user-tie me-2"></i>
                  Thông Tin Nhân Viên
                </h4>
                <small class="opacity-75">ID: #{{ $route.params.id }}</small>
              </div>
              <div class="text-end">
                <span class="badge" :class="form.trangThai === 1 ? 'bg-light text-success' : 'bg-light text-danger'">
                  <i :class="form.trangThai === 1 ? 'fas fa-user-check' : 'fas fa-user-times'" class="me-1"></i>
                  {{ form.trangThai === 1 ? 'Đang làm việc' : 'Đã nghỉ việc' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Form Content -->
          <div class="card-body p-4">
            <form @submit.prevent="update">
              <!-- Employee Info Display -->
              <div class="row mb-4">
                <div class="col-12">
                  <div class="d-flex align-items-center p-3 bg-light rounded">
                    <div class="bg-gradient rounded-circle me-3 d-flex align-items-center justify-content-center text-white fw-bold" 
                         style="width: 60px; height: 60px; background: linear-gradient(45deg, #28a745, #20c997);">
                      {{ getInitials(form.hoTen) }}
                    </div>
                    <div class="flex-grow-1">
                      <h5 class="mb-1">{{ form.hoTen }}</h5>
                      <p class="text-muted mb-1">{{ form.email }}</p>
                      <small class="text-success fw-semibold">{{ form.maNhanVien }}</small>
                    </div>
                    <div class="text-end">
                      <div class="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2">
                        <i class="fas fa-briefcase me-1"></i>
                        Nhân viên
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Row 1: Mã NV và Họ Tên -->
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">
                    <i class="fas fa-id-badge text-success me-2"></i>
                    Mã Nhân Viên
                  </label>
                  <input 
                    type="text" 
                    v-model="form.maNhanVien" 
                    class="form-control form-control-lg"
                    :class="{ 'is-invalid': errors.maNhanVien }"
                    placeholder="Nhập mã nhân viên"
                  />
                  <div v-if="errors.maNhanVien" class="invalid-feedback">
                    {{ errors.maNhanVien }}
                  </div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">
                    <i class="fas fa-user text-success me-2"></i>
                    Họ và Tên
                  </label>
                  <input 
                    type="text" 
                    v-model="form.hoTen" 
                    class="form-control form-control-lg"
                    :class="{ 'is-invalid': errors.hoTen }"
                    placeholder="Nhập họ và tên"
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
                    <i class="fas fa-envelope text-success me-2"></i>
                    Email
                  </label>
                  <input 
                    type="email" 
                    v-model="form.email" 
                    class="form-control form-control-lg"
                    :class="{ 'is-invalid': errors.email }"
                    placeholder="example@company.com"
                  />
                  <div v-if="errors.email" class="invalid-feedback">
                    {{ errors.email }}
                  </div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">
                    <i class="fas fa-phone text-success me-2"></i>
                    Số Điện Thoại
                  </label>
                  <input 
                    type="text" 
                    v-model="form.sdt" 
                    class="form-control form-control-lg"
                    :class="{ 'is-invalid': errors.sdt }"
                    placeholder="0123456789"
                  />
                  <div v-if="errors.sdt" class="invalid-feedback">
                    {{ errors.sdt }}
                  </div>
                </div>
              </div>

              <!-- Trạng Thái -->
              <div class="mb-4">
                <label class="form-label fw-semibold">
                  <i class="fas fa-toggle-on text-success me-2"></i>
                  Trạng Thái Làm Việc
                </label>
                <select 
                  v-model="form.trangThai" 
                  class="form-select form-select-lg"
                >
                  <option :value="1">
                    🟢 Đang làm việc
                  </option>
                  <option :value="0">
                    🔴 Đã nghỉ việc
                  </option>
                </select>
                <div class="form-text">
                  <i class="fas fa-info-circle me-1"></i>
                  Thay đổi trạng thái sẽ ảnh hưởng đến quyền truy cập hệ thống
                </div>
              </div>

              <!-- Success Message -->
              <div v-if="showSuccess" class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Thành công!</strong> Thông tin nhân viên đã được cập nhật!
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
                  :disabled="isUpdating"
                  class="btn btn-success btn-lg me-md-2"
                  style="min-width: 150px;"
                >
                  <span v-if="isUpdating" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="fas fa-save me-2"></i>
                  {{ isUpdating ? 'Đang cập nhật...' : 'Cập Nhật' }}
                </button>
                
                <router-link 
                  to="/nhan-vien" 
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

        <!-- Employee Info Card -->
        <div class="card mt-4 border-0 shadow-sm">
          <div class="card-header bg-light">
            <h6 class="card-title mb-0">
              <i class="fas fa-info-circle me-2"></i>
              Thông Tin Bổ Sung
            </h6>
          </div>
          <div class="card-body">
            <div class="row text-center">
              <div class="col-md-3">
                <div class="p-3">
                  <i class="fas fa-calendar-plus fa-2x text-info mb-2"></i>
                  <h6 class="fw-bold">Ngày Vào Làm</h6>
                  <small class="text-muted">{{ formatDate(new Date()) }}</small>
                </div>
              </div>
              <div class="col-md-3">
                <div class="p-3">
                  <i class="fas fa-edit fa-2x text-warning mb-2"></i>
                  <h6 class="fw-bold">Lần Cập Nhật</h6>
                  <small class="text-muted">{{ updateCount }} lần</small>
                </div>
              </div>
              <div class="col-md-3">
                <div class="p-3">
                  <i class="fas fa-user-check fa-2x text-success mb-2"></i>
                  <h6 class="fw-bold">Trạng Thái</h6>
                  <small class="text-muted">{{ form.trangThai === 1 ? 'Đang hoạt động' : 'Tạm nghỉ' }}</small>
                </div>
              </div>
              <div class="col-md-3">
                <div class="p-3">
                  <i class="fas fa-building fa-2x text-primary mb-2"></i>
                  <h6 class="fw-bold">Phòng Ban</h6>
                  <small class="text-muted">Nhân sự</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions Card -->
        <div class="card mt-4 border-0 shadow-sm">
          <div class="card-body">
            <h6 class="card-title">
              <i class="fas fa-bolt me-2"></i>
              Thao Tác Nhanh
            </h6>
            <div class="d-flex flex-wrap gap-2">
              <button @click="resetForm" class="btn btn-outline-warning btn-sm">
                <i class="fas fa-undo me-1"></i>
                Khôi phục dữ liệu gốc
              </button>
              <button @click="toggleStatus" class="btn btn-outline-info btn-sm">
                <i class="fas fa-sync-alt me-1"></i>
                {{ form.trangThai === 1 ? 'Cho nghỉ việc' : 'Kích hoạt lại' }}
              </button>
              <router-link :to="`/nhan-vien/detail/${$route.params.id}`" class="btn btn-outline-success btn-sm">
                <i class="fas fa-eye me-1"></i>
                Xem chi tiết
              </router-link>
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
  name: 'NhanVienUpdate',
  data() {
    return {
      form: null,
      originalForm: null, // Store original data for reset
      isLoading: true,
      isUpdating: false,
      showSuccess: false,
      errorMessage: '',
      loadError: '',
      errors: {},
      updateCount: 0
    };
  },
  async mounted() {
    await this.loadEmployeeData();
  },
  methods: {
    async loadEmployeeData() {
      const id = this.$route.params.id;
      this.isLoading = true;
      this.loadError = '';
      
      try {
        const res = await axios.get(`http://localhost:8080/nhan-vien/${id}`);
        this.form = { ...res.data };
        this.originalForm = { ...res.data }; // Store original data
        
        // Simulate update count (you can get this from API)
        this.updateCount = Math.floor(Math.random() * 15) + 1;
        
      } catch (error) {
        console.error('Error loading employee:', error);
        
        if (error.response?.status === 404) {
          this.loadError = 'Không tìm thấy nhân viên với ID này.';
        } else if (error.response?.status === 403) {
          this.loadError = 'Bạn không có quyền truy cập thông tin này.';
        } else {
          this.loadError = 'Có lỗi xảy ra khi tải thông tin nhân viên.';
        }
      } finally {
        this.isLoading = false;
      }
    },

    validateForm() {
      this.errors = {};
      
      // Validate Mã Nhân Viên
      if (!this.form.maNhanVien?.trim()) {
        this.errors.maNhanVien = 'Mã nhân viên không được để trống';
      } else if (this.form.maNhanVien.length < 3) {
        this.errors.maNhanVien = 'Mã nhân viên phải có ít nhất 3 ký tự';
      } else if (!/^[A-Z0-9]+$/.test(this.form.maNhanVien)) {
        this.errors.maNhanVien = 'Mã nhân viên chỉ được chứa chữ hoa và số';
      }
      
      // Validate Họ Tên
      if (!this.form.hoTen?.trim()) {
        this.errors.hoTen = 'Họ tên không được để trống';
      } else if (this.form.hoTen.length < 2) {
        this.errors.hoTen = 'Họ tên phải có ít nhất 2 ký tự';
      }
      
      // Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.form.email?.trim()) {
        this.errors.email = 'Email không được để trống';
      } else if (!emailRegex.test(this.form.email)) {
        this.errors.email = 'Email không đúng định dạng';
      }
      
      // Validate SĐT
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!this.form.sdt?.trim()) {
        this.errors.sdt = 'Số điện thoại không được để trống';
      } else if (!phoneRegex.test(this.form.sdt)) {
        this.errors.sdt = 'Số điện thoại phải có 10-11 chữ số';
      }
      
      return Object.keys(this.errors).length === 0;
    },

    async update() {
      // Validate form
      if (!this.validateForm()) {
        return;
      }

      const id = this.$route.params.id;
      this.isUpdating = true;
      this.errorMessage = '';
      this.showSuccess = false;

      try {
        await axios.put(`http://localhost:8080/nhan-vien/${id}`, this.form);
        
        // Show success message
        this.showSuccess = true;
        this.updateCount++;
        
        // Update original form data
        this.originalForm = { ...this.form };
        
        // Redirect after 2 seconds
        setTimeout(() => {
          this.$router.push('/nhan-vien');
        }, 2000);
        
      } catch (error) {
        console.error('Error updating employee:', error);
        
        if (error.response?.status === 400) {
          this.errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
        } else if (error.response?.status === 404) {
          this.errorMessage = 'Không tìm thấy nhân viên để cập nhật.';
        } else if (error.response?.status === 409) {
          this.errorMessage = 'Mã nhân viên hoặc email đã tồn tại.';
        } else {
          this.errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.';
        }
      } finally {
        this.isUpdating = false;
      }
    },

    resetForm() {
      if (this.originalForm) {
        this.form = { ...this.originalForm };
        this.errors = {};
        this.errorMessage = '';
        this.showSuccess = false;
      }
    },

    toggleStatus() {
      this.form.trangThai = this.form.trangThai === 1 ? 0 : 1;
    },

    getInitials(name) {
      if (!name) return 'NV';
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    },

    formatDate(date) {
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
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
  border-color: #28a745;
  box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
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

.bg-gradient {
  background: linear-gradient(45deg, #28a745, #20c997) !important;
}

.spinner-border {
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

.btn-outline-warning:hover,
.btn-outline-info:hover,
.btn-outline-success:hover {
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .d-grid.gap-2.d-md-flex {
    display: grid !important;
  }
  
  .btn {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .d-flex.flex-wrap.gap-2 {
    flex-direction: column;
  }
  
  .d-flex.flex-wrap.gap-2 .btn {
    margin-bottom: 5px;
  }
}

/* Loading animation */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>