<template>
  <div class="container-fluid py-4" style="background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%); min-height: 100vh;">
    <!-- Header Section -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex align-items-center mb-3">
          <div class="bg-success text-white rounded p-3 me-3" style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-user-tie"></i>
          </div>
          <div>
            <h2 class="mb-1 fw-bold">➕ Thêm Nhân Viên Mới</h2>
            <p class="text-muted mb-0">Điền thông tin để tạo nhân viên mới trong hệ thống</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Card -->
    <div class="row justify-content-center">
      <div class="col-lg-8 col-xl-6">
        <div class="card shadow-lg border-0">
          <!-- Card Header -->
          <div class="card-header text-white" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
            <h4 class="card-title mb-0">
              <i class="fas fa-user-plus me-2"></i>
              Thông Tin Nhân Viên
            </h4>
            <small class="opacity-75">Vui lòng điền đầy đủ thông tin bên dưới</small>
          </div>

          <!-- Form Content -->
          <div class="card-body p-4">
            <form @submit.prevent="create">
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
                    required 
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
                    required 
                  />
                  <div v-if="errors.hoTen" class="invalid-feedback">
                    {{ errors.hoTen }}
                  </div>
                </div>
              </div>

              <!-- Row 2: Email (cho tài khoản mới) và SĐT -->
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">
                    <i class="fas fa-envelope text-success me-2"></i>
                    Email (cho tài khoản mới)
                  </label>
                  <input 
                    type="email" 
                    v-model="form.email" 
                    class="form-control form-control-lg"
                    :class="{ 'is-invalid': errors.email }"
                    placeholder="example@company.com"
                    :disabled="form.idTaiKhoan"
                  />
                  <div v-if="errors.email" class="invalid-feedback">
                    {{ errors.email }}
                  </div>
                  <small class="form-text text-muted">
                    Để trống nếu không muốn tạo tài khoản đăng nhập
                  </small>
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
                    required 
                  />
                  <div v-if="errors.sdt" class="invalid-feedback">
                    {{ errors.sdt }}
                  </div>
                </div>
              </div>

              <!-- Row 3: Tài khoản và Trạng thái -->
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">
                    <i class="fas fa-link text-success me-2"></i>
                    Liên kết với tài khoản có sẵn
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
                    Chọn tài khoản có sẵn hoặc nhập email để tạo mới
                  </small>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label fw-semibold">
                    <i class="fas fa-toggle-on text-success me-2"></i>
                    Trạng Thái
                  </label>
                  <select 
                    v-model="form.trangThai" 
                    class="form-select form-select-lg"
                  >
                    <option :value="1">
                      🟢 Đang làm việc
                    </option>
                    <option :value="0">
                      🔴 Nghỉ việc
                    </option>
                  </select>
                </div>
              </div>

              <!-- Success Message -->
              <div v-if="showSuccess" class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Thành công!</strong> Nhân viên đã được thêm thành công!
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
                  <i v-else class="fas fa-user-plus me-2"></i>
                  {{ isLoading ? 'Đang thêm...' : 'Thêm Nhân Viên' }}
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

        <!-- Employee Benefits Card -->
        <div class="card mt-4 border-0 shadow-sm">
          <div class="card-header bg-light">
            <h6 class="card-title mb-0">
              <i class="fas fa-info-circle me-2"></i>
              Lưu ý quan trọng
            </h6>
          </div>
          <div class="card-body">
            <ul class="mb-0">
              <li>Nhân viên có thể được tạo <strong>không cần tài khoản</strong> (nhân viên bán hàng trực tiếp)</li>
              <li>Nếu muốn nhân viên đăng nhập hệ thống, hãy <strong>nhập email</strong> để tạo tài khoản</li>
              <li>Có thể liên kết với <strong>tài khoản nhân viên có sẵn</strong> từ danh sách</li>
              <li>Email trong hệ thống được lưu ở bảng <strong>tai_khoan</strong>, không phải nhan_vien</li>
              <li>Mã nhân viên nên theo format: <strong>NV + số</strong> (VD: NV001, NV002)</li>
            </ul>
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
              <button @click="generateEmployeeCode" class="btn btn-outline-success btn-sm">
                <i class="fas fa-magic me-1"></i>
                Tạo mã NV tự động
              </button>
              <button @click="resetForm" class="btn btn-outline-warning btn-sm">
                <i class="fas fa-undo me-1"></i>
                Reset form
              </button>
              <button @click="fillSampleData" class="btn btn-outline-info btn-sm">
                <i class="fas fa-fill me-1"></i>
                Dữ liệu mẫu
              </button>
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
  name: 'NhanVienAdd',
  data() {
    return {
      form: {
        maNhanVien: '',
        hoTen: '',
        email: '', // Email cho tài khoản mới
        sdt: '',
        trangThai: 1,
        idTaiKhoan: null,
        idDiaChi: null
      },
      availableAccounts: [],
      isLoading: false,
      showSuccess: false,
      errorMessage: '',
      errors: {}
    };
  },
  async mounted() {
    await this.loadAvailableAccounts();
    if (!this.form.maNhanVien) {
      this.generateEmployeeCode();
    }
  },
  methods: {
    async loadAvailableAccounts() {
      try {
        const res = await axios.get('http://localhost:8080/tai-khoan');
        // Lọc chỉ lấy tài khoản nhân viên (vaiTro = 1) chưa được liên kết
        this.availableAccounts = res.data.filter(tk => tk.vaiTro === 1);
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    },

    onTaiKhoanChange() {
      // Nếu chọn tài khoản có sẵn, xóa email
      if (this.form.idTaiKhoan) {
        this.form.email = '';
      }
    },

    validateForm() {
      this.errors = {};
      
      // Validate Mã Nhân Viên
      if (!this.form.maNhanVien.trim()) {
        this.errors.maNhanVien = 'Mã nhân viên không được để trống';
      } else if (this.form.maNhanVien.length < 3) {
        this.errors.maNhanVien = 'Mã nhân viên phải có ít nhất 3 ký tự';
      } else if (!/^[A-Z0-9]+$/.test(this.form.maNhanVien)) {
        this.errors.maNhanVien = 'Mã nhân viên chỉ được chứa chữ hoa và số';
      }
      
      // Validate Họ Tên
      if (!this.form.hoTen.trim()) {
        this.errors.hoTen = 'Họ tên không được để trống';
      } else if (this.form.hoTen.length < 2) {
        this.errors.hoTen = 'Họ tên phải có ít nhất 2 ký tự';
      }
      
      // Validate Email - chỉ khi có nhập và không chọn tài khoản có sẵn
      if (this.form.email && !this.form.idTaiKhoan) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.form.email)) {
          this.errors.email = 'Email không đúng định dạng';
        }
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
        // Chuẩn bị dữ liệu gửi lên
        const requestData = {
          maNhanVien: this.form.maNhanVien,
          hoTen: this.form.hoTen,
          sdt: this.form.sdt,
          trangThai: this.form.trangThai,
          idTaiKhoan: this.form.idTaiKhoan,
          idDiaChi: this.form.idDiaChi
        };

        // Thêm email nếu cần tạo tài khoản mới
        if (this.form.email && !this.form.idTaiKhoan) {
          requestData.email = this.form.email;
        }

        await axios.post('http://localhost:8080/nhan-vien', requestData);
        
        // Show success message
        this.showSuccess = true;
        
        // Reset form
        this.resetForm();
        
        // Redirect after 2 seconds
        setTimeout(() => {
          this.$router.push('/nhan-vien');
        }, 2000);
        
      } catch (error) {
        console.error('Error creating employee:', error);
        
        if (error.response?.status === 400) {
          this.errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
        } else if (error.response?.status === 409) {
          this.errorMessage = 'Mã nhân viên hoặc email đã tồn tại.';
        } else {
          this.errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi thêm nhân viên. Vui lòng thử lại.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    resetForm() {
      this.form = {
        maNhanVien: '',
        hoTen: '',
        email: '',
        sdt: '',
        trangThai: 1,
        idTaiKhoan: null,
        idDiaChi: null
      };
      this.errors = {};
      this.errorMessage = '';
      this.showSuccess = false;
      this.generateEmployeeCode();
    },

    // Auto-generate employee code
    generateEmployeeCode() {
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      this.form.maNhanVien = `NV${timestamp}${randomNum}`;
    },

    // Fill sample data for testing
    fillSampleData() {
      this.form.maNhanVien = 'NV' + Date.now().toString().slice(-6);
      this.form.hoTen = 'Nguyễn Văn A';
      this.form.email = 'nhanvien@company.com';
      this.form.sdt = '0123456789';
      this.form.trangThai = 1;
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

.btn-outline-success:hover,
.btn-outline-warning:hover,
.btn-outline-info:hover {
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

/* Custom animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>