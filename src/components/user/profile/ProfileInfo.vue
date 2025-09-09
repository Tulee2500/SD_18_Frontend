<template>
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h4 class="text-xl font-semibold text-gray-800 mb-6">THÔNG TIN CÁ NHÂN</h4>

      <form @submit.prevent="updateProfile" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Họ</label>
            <input
              v-model="profileForm.ho"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              placeholder="Nhập họ"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tên</label>
            <input
              v-model="profileForm.ten"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              placeholder="Nhập tên"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
            <div class="flex gap-6">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="profileForm.gioiTinh"
                  type="radio"
                  value="Nu"
                  class="mr-2 text-orange-500 focus:ring-orange-500"
                />
                <span>Nữ</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="profileForm.gioiTinh"
                  type="radio"
                  value="Nam"
                  class="mr-2 text-orange-500 focus:ring-orange-500"
                />
                <span>Nam</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
            <input
              v-model="profileForm.ngaySinh"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
            <input
              v-model="profileForm.sdt"
              type="tel"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              v-model="profileForm.email"
              type="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 outline-none"
              placeholder="Nhập email"
              readonly
            />
          </div>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="isLoading"
            class="px-8 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang cập nhật...
            </span>
            <span v-else>Cập nhật</span>
          </button>
        </div>
      </form>
    </div>
  </template>

  <script setup>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  import { useToast } from 'primevue/usetoast';

  const toast = useToast();

  // State
  const isLoading = ref(false);
  const userInfo = ref({});

  // Form data
  const profileForm = ref({
    ho: '',
    ten: '',
    gioiTinh: 'Nu',
    ngaySinh: '',
    sdt: '',
    email: ''
  });

  // API Configuration
  const API_BASE_URL = 'http://localhost:8080';

  // Auth helpers
  const getAuthToken = () => localStorage.getItem('auth_token');

  // Load user info
  const loadUserInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/khach-hang/current`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      userInfo.value = response.data;
      console.log('User info loaded:', userInfo.value);

      // Split họ tên
      const fullName = response.data.hoTen || '';
      const nameParts = fullName.split(' ');
      profileForm.value = {
        ho: nameParts.slice(0, -1).join(' '),
        ten: nameParts[nameParts.length - 1] || '',
        gioiTinh: response.data.gioiTinh || 'Nu',
        ngaySinh: response.data.ngaySinh ? formatDateForInput(response.data.ngaySinh) : '',
        sdt: response.data.sdt || '',
        email: response.data.taiKhoan?.email || response.data.email || ''
      };
    } catch (error) {
      console.error('Error loading user info:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải thông tin người dùng',
        life: 3000
      });
    }
  };

  // Update profile
  const updateProfile = async () => {
    isLoading.value = true;
    try {
      const updateData = {
        hoTen: `${profileForm.value.ho} ${profileForm.value.ten}`.trim(),
        gioiTinh: profileForm.value.gioiTinh,
        ngaySinh: profileForm.value.ngaySinh,
        sdt: profileForm.value.sdt
      };

      await axios.put(`${API_BASE_URL}/api/khach-hang/${userInfo.value.id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Cập nhật thông tin thành công!',
        life: 3000
      });

      await loadUserInfo();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể cập nhật thông tin!',
        life: 3000
      });
    } finally {
      isLoading.value = false;
    }
  };

  // Utility functions
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Lifecycle
  onMounted(() => {
    loadUserInfo();
  });
  </script>

  <style scoped>
  input:focus,
  select:focus,
  textarea:focus {
    outline: none !important;
  }

  input[type="radio"]:checked {
    background-color: #ea580c;
    border-color: #ea580c;
  }

  input[type="radio"]:focus {
    box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  button {
    transition: all 0.2s ease;
  }

  .bg-orange-600 {
    background-color: #ea580c;
  }

  .hover\:bg-orange-700:hover {
    background-color: #c2410c;
  }

  .text-orange-500 {
    color: #f97316;
  }

  .focus\:ring-orange-500:focus {
    --tw-ring-color: #f97316;
  }

  .focus\:border-orange-500:focus {
    --tw-ring-color: #f97316;
    border-color: #f97316;
  }
  </style>
