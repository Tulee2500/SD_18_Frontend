<template>
  <div class="container-fluid py-4" style="background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%); min-height: 100vh;">
    <!-- Header Section -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex align-items-center mb-3">
          <div class="bg-primary text-white rounded p-3 me-3" style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-user-edit"></i>
          </div>
          <div>
            <h2 class="mb-1 fw-bold">✏️ Cập Nhật Khách Hàng</h2>
            <p class="text-muted mb-0">Chỉnh sửa thông tin khách hàng trong hệ thống</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="row justify-content-center">
      <div class="col-lg-8 col-xl-6">
        <div class="card shadow-lg border-0">
          <div class="card-body text-center py-5">
            <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
              <span class="visually-hidden">Loading...</span>
            </div>
            <h5 class="text-muted">Đang tải thông tin khách hàng...</h5>
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
            <h5 class="text-danger mb-3">Không thể tải thông tin khách hàng</h5>
            <p class="text-muted mb-4">{{ loadError }}</p>
            <div class="d-flex gap-2 justify-content-center">
              <button @click="loadCustomerData" class="btn btn-primary">
                <i class="fas fa-redo me-2"></i>Thử lại
              </button>
              <router-link to="/khach-hang" class="btn btn-secondary">
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
          <div class="card-header text-white" style="background: linear-gradient(135deg, #007bff 0%, #6f42c1 100%);">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h4 class="card-title mb-0">
                  <i class="fas fa-user-edit me-2"></i>
                  Thông Tin Khách Hàng
                </h4>
                <small class="opacity-75">ID: #{{ $route.params.id }}</small>
              </div>
              <div class="text-end">
                <span class="badge" :class="form.trangThai === 1 ? 'bg-success' : 'bg-danger'">
                  <i :class="form.trangThai === 1 ? 'fas fa-check-circle' : 'fas fa-times-circle'" class="me-1"></i>
                  {{ form.trangThai === 1 ? 'Hoạt động' : 'Ngưng' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Form Content -->
          <div class="card-body p-4">
            <form @submit.prevent="update">
              <!-- Customer Info Display -->
              <div class="row mb-4">
                <div class="col-12">
                  <div class="d-flex align-items-center p-3 bg-light rounded">
                    <div class="bg-gradient rounded-circle me-3 d-flex align-items-center justify-content-center text-white fw-bold" 
                         style="width: 60px; height: 60px; background: linear-gradient(45deg, #007bff, #6f42c1);">
                      {{ getInitials(form.hoTen) }}
                    </div>
                    <div>
                      <h5 class="mb-1">{{ form.hoTen }}</h5>
                      <p class="text-muted mb-0">
                        <i class="fas fa-envelope me-1"></i>
                        {{ currentEmail || 'Chưa có email' }}
                      </p>
                      <small class="text-info">
                        <i class="fas fa-user-circle me-1"></i>
                        {{ form.idTaiKhoan ? `Đã liên kết tài khoản #${form.idTaiKhoan}` : 'Chưa có tài khoản' }}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

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
                  />
                  <div v-if="errors.hoTen" class="invalid-feedback">
                    {{ errors.hoTen }}
                  </div>
                </div>
              </div>

              <!-- Row 2: Tài khoản và SĐT -->
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">
                    <i class="fas fa-link text-primary me-2"></i>
                    Tài khoản liên kết
                  </label>
                  <select 
                    v-model="form.idTaiKhoan" 
                    class="form-select form-select-lg"
                    @change="onTaiKhoanChange"
                  >
                    <option :value="null">-- Không liên kết --</option>
                    <option v-for="tk in availableAccounts" :key="tk.id" :value="tk.id">
                      {{ tk.email }} ({{ tk.maTaiKhoan }})
                    </option>
                  </select>
                  <small class="form-text text-muted">
                    Thay đổi tài khoản liên kết cho khách hàng
                  </small>
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
                  />
                  <div v-if="errors.sdt" class="invalid-feedback">
                    {{ errors.sdt }}
                  </div>
                </div>
              </div>

              <!-- Row 3: Ví điểm và Trạng thái -->
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">
                    <i class="fas fa-wallet text-primary me-2"></i>
                    ID Ví điểm
                  </label>
                  <input 
                    type="number" 
                    v-model="form.idViDiem" 
                    class="form-control form-control-lg"
                    placeholder="ID ví điểm"
                  />
                  <small class="form-text text-muted">
                    Để trống nếu không có ví điểm
                  </small>
                </div>

                <div class="col-md-6 mb-3">
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
              </div>

              <!-- Success Message -->
              <div v-if="showSuccess" class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Thành công!</strong> Thông tin khách hàng đã được cập nhật!
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
                  class="btn btn-primary btn-lg me-md-2"
                  style="min-width: 150px;"
                >
                  <span v-if="isUpdating" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="fas fa-save me-2"></i>
                  {{ isUpdating ? 'Đang cập nhật...' : 'Cập Nhật' }}
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
          <div class="card-header bg-light">
            <h6 class="card-title mb-0">
              <i class="fas fa-history me-2"></i>
              Thông Tin Bổ Sung
            </h6>
          </div>
          <div class="card-body">
            <div class="row text-center">
              <div class="col-md-4">
                <div class="p-3">
                  <i class="fas fa-calendar-alt fa-2x text-info mb-2"></i>
                  <h6 class="fw-bold">Ngày Tạo</h6>
                  <small class="text-muted">{{ formatDate(form.ngayTao) }}</small>
                </div>
              </div>
              <div class="col-md-4">
                <div class="p-3">
                  <i class="fas fa-clock fa-2x text-warning mb-2"></i>
                  <h6 class="fw-bold">Cập Nhật Lần Cuối</h6>
                  <small class="text-muted">{{ formatDate(form.ngayCapNhat) }}</small>
                </div>
              </div>
              <div class="col-md-4">
                <div class="p-3">
                  <i class="fas fa-shopping-cart fa-2x text-success mb-2"></i>
                  <h6 class="fw-bold">Loại Khách Hàng</h6>
                  <small class="text-muted">{{ form.idTaiKhoan ? 'Khách hàng online' : 'Khách hàng offline' }}</small>
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
  name: 'KhachHangUpdate',
  data() {
    return {
      form: null,
      availableAccounts: [],
      currentEmail: '',
      isLoading: true,
      isUpdating: false,
      showSuccess: false,
      errorMessage: '',
      loadError: '',
      errors: {}
    };
  },
  async mounted() {
    await this.loadCustomerData();
    await this.loadAvailableAccounts();
  },
  methods: {
    async loadCustomerData() {
      const id = this.$route.params.id;
      this.isLoading = true;
      this.loadError = '';
      
      try {
        const res = await axios.get(`http://localhost:8080/khach-hang/${id}`);
        this.form = res.data;
        
        // Lấy email từ tài khoản nếu có
        if (this.form.idTaiKhoan) {
          try {
            const tkRes = await axios.get(`http://localhost:8080/tai-khoan/${this.form.idTaiKhoan}`);
            this.currentEmail = tkRes.data.email;
          } catch (error) {
            console.log('Could not load account email');
          }
        }
        
      } catch (error) {
        console.error('Error loading customer:', error);
        
        if (error.response?.status === 404) {
          this.loadError = 'Không tìm thấy khách hàng với ID này.';
        } else if (error.response?.status === 403) {
          this.loadError = 'Bạn không có quyền truy cập thông tin này.';
        } else {
          this.loadError = 'Có lỗi xảy ra khi tải thông tin khách hàng.';
        }
      } finally {
        this.isLoading = false;
      }
    },

    async loadAvailableAccounts() {
      try {
        const res = await axios.get('http://localhost:8080/tai-khoan');
        // Lọc chỉ lấy tài khoản khách hàng (vaiTro = 0)
        this.availableAccounts = res.data.filter(tk => tk.vaiTro === 0);
        
        // Thêm tài khoản hiện tại nếu có
        if (this.form?.idTaiKhoan) {
          const currentAccount = res.data.find(tk => tk.id === this.form.idTaiKhoan);
          if (currentAccount && !this.availableAccounts.find(tk => tk.id === currentAccount.id)) {
            this.availableAccounts.push(currentAccount);
          }
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    },

    onTaiKhoanChange() {
      // Cập nhật email hiển thị khi thay đổi tài khoản
      if (this.form.idTaiKhoan) {
        const account = this.availableAccounts.find(tk => tk.id === this.form.idTaiKhoan);
        this.currentEmail = account ? account.email : '';
      } else {
        this.currentEmail = '';
      }
    },

    validateForm() {
      this.errors = {};
      
      // Validate Mã Khách Hàng
      if (!this.form.maKhachHang?.trim()) {
        this.errors.maKhachHang = 'Mã khách hàng không được để trống';
      } else if (this.form.maKhachHang.length < 3) {
        this.errors.maKhachHang = 'Mã khách hàng phải có ít nhất 3 ký tự';
      }
      
      // Validate Họ Tên
      if (!this.form.hoTen?.trim()) {
        this.errors.hoTen = 'Họ tên không được để trống';
      } else if (this.form.hoTen.length < 2) {
        this.errors.hoTen = 'Họ tên phải có ít nhất 2 ký tự';
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
        // Chuẩn bị dữ liệu theo đúng DTO
        const requestData = {
          id: this.form.id,
          maKhachHang: this.form.maKhachHang,
          hoTen: this.form.hoTen,
          sdt: this.form.sdt,
          trangThai: this.form.trangThai,
          idTaiKhoan: this.form.idTaiKhoan,
          idViDiem: this.form.idViDiem
        };

        // Nếu có email từ tài khoản được chọn, thêm vào
        if (this.currentEmail) {
          requestData.email = this.currentEmail;
        }

        const response = await axios.put(`http://localhost:8080/khach-hang/${id}`, requestData);
        
        // Show success message
        this.showSuccess = true;
        
        // Reload data to get latest info
        await this.loadCustomerData();
        
        // Redirect after 2 seconds
        setTimeout(() => {
          this.$router.push('/khach-hang');
        }, 2000);
        
      } catch (error) {
        console.error('Error updating customer:', error);
        
        if (error.response?.status === 400) {
          if (error.response.data.errors) {
            this.errors = error.response.data.errors;
            this.errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
          } else {
            this.errorMessage = error.response.data.error || 'Dữ liệu không hợp lệ.';
          }
        } else if (error.response?.status === 404) {
          this.errorMessage = 'Không tìm thấy khách hàng để cập nhật.';
        } else if (error.response?.status === 409) {
          this.errorMessage = 'Mã khách hàng đã tồn tại.';
        } else {
          this.errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.';
        }
      } finally {
        this.isUpdating = false;
      }
    },

    getInitials(name) {
      if (!name) return 'KH';
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    },

    formatDate(date) {
      if (!date) return 'N/A';
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(date));
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

.bg-gradient {
  background: linear-gradient(45deg, #007bff, #6f42c1) !important;
}

.spinner-border {
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
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

/* Loading animation */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>