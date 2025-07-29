<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
const email = ref('');
const password = ref('');
const checked = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);

const router = useRouter();

// Kiểm tra nếu user đã đăng nhập (từ localStorage hoặc session)
onMounted(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        // User đã đăng nhập, chuyển hướng
        router.push('/san-pham');
    }
});

const validateForm = () => {
    if (!email.value || !email.value.trim()) {
        errorMessage.value = 'Vui lòng nhập email';
        return false;
    }

    if (!isValidEmail(email.value)) {
        errorMessage.value = 'Email không hợp lệ';
        return false;
    }

    if (!password.value || password.value.length < 6) {
        errorMessage.value = 'Mật khẩu phải có ít nhất 6 ký tự';
        return false;
    }

    return true;
};

const isValidEmail = (email) => {
    // Regex cho phép cả .example domain cho demo
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|gov|mil|example)$/i;
    return emailRegex.test(email);
};

const login = async () => {
    try {
        isLoading.value = true;
        errorMessage.value = '';
        successMessage.value = '';

        // Validate form
        if (!validateForm()) {
            return;
        }

        console.log('🔄 Attempting login...');

        // Gọi API backend để đăng nhập
        const response = await fetch('http://localhost:8080/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                email: email.value,
                matKhau: password.value
            }),
            credentials: 'include'
        });

        const data = await response.json();
        console.log('📝 Login response:', data);

        if (response.ok && data.success) {
            successMessage.value = 'Đăng nhập thành công!';

            // Lưu token
            localStorage.setItem('auth_token', data.data.token);

            // Tạo object user info đầy đủ với thông tin nhân viên
            const userInfo = {
                id: data.data.user.id,
                email: data.data.user.email,
                vaiTro: data.data.user.vaiTro,
                maTaiKhoan: data.data.user.maTaiKhoan,

                // Thêm thông tin nhân viên với nhiều fallback
                tenNhanVien: data.data.user.tenNhanVien || data.data.user.hoTen || data.data.user.hoVaTen || data.data.user.fullName || data.data.user.name || data.data.user.email?.split('@')[0] || 'Nhân viên',

                maNhanVien: data.data.user.maNhanVien || data.data.user.maNV || data.data.user.employeeCode || data.data.user.staffCode || data.data.user.maTaiKhoan || `NV${data.data.user.id}` || 'NV001',

                // Backup fields
                hoTen: data.data.user.hoTen || data.data.user.tenNhanVien || data.data.user.email?.split('@')[0] || 'Nhân viên'
            };

            // Log để debug
            console.log('💾 Saving user info:', userInfo);

            // Lưu thông tin user với key chính xác
            localStorage.setItem('user_info', JSON.stringify(userInfo));

            // Lưu thông tin "Remember me"
            if (checked.value) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('savedEmail', email.value);
            } else {
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('savedEmail');
            }

            // Verify data đã được lưu
            const savedUserInfo = localStorage.getItem('user_info');
            console.log('✅ Verified saved user info:', JSON.parse(savedUserInfo));

            // Chuyển hướng theo role từ backend
            setTimeout(() => {
                if (data.data.user.vaiTro === 'ADMIN') {
                    router.push('/admin');
                } else if (data.data.user.vaiTro === 'NHANVIEN') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            }, 1000);
        } else {
            errorMessage.value = data.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        errorMessage.value = 'Có lỗi xảy ra. Vui lòng thử lại.';
    } finally {
        isLoading.value = false;
    }
};

// Thêm function để test thông tin user sau khi đăng nhập
const testUserInfo = () => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
        const user = JSON.parse(userInfo);
        console.log('🧪 Test - Current user info:', user);
        console.log('👤 Ten nhan vien:', user.tenNhanVien);
        console.log('🆔 Ma nhan vien:', user.maNhanVien);
    } else {
        console.log('❌ No user info found');
    }
};

const getDefaultRoute = () => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
        const user = JSON.parse(userInfo);
        if (user.vaiTro === 'ADMIN' || user.vaiTro === 'NHANVIEN') {
            return '/admin';
        } else {
            return '/';
        }
    }
    return '/';
};

const loginWithDemo = async (demoType) => {
    if (demoType === 'admin') {
        email.value = 'admin@gmail.com';
        password.value = 'admin123';
    } else {
        email.value = 'user@gmail.com';
        password.value = 'user123';
    }
    await login();
};

const forgotPassword = () => {
    router.push('/forgot-password');
};

const goToRegister = () => {
    router.push('/auth/register');
};

// Load saved email nếu có "Remember me"
onMounted(() => {
    if (localStorage.getItem('rememberMe') === 'true') {
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail) {
            email.value = savedEmail;
            checked.value = true;
        }
    }
});
</script>

<template>
    <FloatingConfigurator />
    <div class="flex min-h-screen min-w-[100vw] items-center justify-center overflow-hidden bg-surface-50 dark:bg-surface-950">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 px-8 py-20 sm:px-20 dark:bg-surface-900" style="border-radius: 53px">
                    <div class="mb-8 text-center">
                        <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-8 w-16 shrink-0">
                            <path d="M4 20C4 11.1634 11.1634 4 20 4H34C42.8366 4 50 11.1634 50 20V20C50 28.8366 42.8366 36 34 36H20C11.1634 36 4 28.8366 4 20V20Z" fill="var(--primary-color)" />
                            <path d="M20 12H34V28H20V12Z" fill="white" />
                        </svg>
                        <div class="mb-4 text-3xl font-medium text-surface-900 dark:text-surface-0">Chào mừng đến với Sneaker Store!</div>
                        <span class="font-medium text-muted-color">Đăng nhập để tiếp tục</span>
                    </div>

                    <!-- Thông báo thành công -->
                    <div v-if="successMessage" class="mb-4 rounded-md border border-green-200 bg-green-100 p-3 text-green-700 dark:border-green-800 dark:bg-green-900 dark:text-green-300">
                        <i class="pi pi-check-circle mr-2"></i>
                        {{ successMessage }}
                    </div>

                    <!-- Thông báo lỗi -->
                    <div v-if="errorMessage" class="mb-4 rounded-md border border-red-200 bg-red-100 p-3 text-red-700 dark:border-red-800 dark:bg-red-900 dark:text-red-300">
                        <i class="pi pi-exclamation-triangle mr-2"></i>
                        {{ errorMessage }}
                    </div>

                    <form @submit.prevent="login">
                        <div class="mb-6">
                            <label for="email1" class="mb-2 block text-xl font-medium text-surface-900 dark:text-surface-0"> Email <span class="text-red-500">*</span> </label>
                            <InputText id="email1" type="email" placeholder="Nhập địa chỉ email" class="w-full md:w-[30rem]" v-model="email" :class="{ 'p-invalid': errorMessage && !email }" autocomplete="username" />
                        </div>

                        <div class="mb-4">
                            <label for="password1" class="mb-2 block text-xl font-medium text-surface-900 dark:text-surface-0"> Mật khẩu <span class="text-red-500">*</span> </label>
                            <Password
                                id="password1"
                                v-model="password"
                                placeholder="Nhập mật khẩu"
                                :toggleMask="true"
                                class="w-full"
                                fluid
                                :feedback="false"
                                :class="{ 'p-invalid': errorMessage && password.length < 6 }"
                                autocomplete="current-password"
                            />
                        </div>

                        <div class="mb-8 mt-2 flex items-center justify-between gap-4">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2" />
                                <label for="rememberme1" class="cursor-pointer text-sm">Ghi nhớ đăng nhập</label>
                            </div>
                            <span class="cursor-pointer text-sm font-medium text-primary no-underline hover:underline" @click="forgotPassword"> Quên mật khẩu? </span>
                        </div>

                        <Button type="submit" :label="isLoading ? 'Đang xử lý...' : 'Đăng nhập'" class="mb-4 w-full" :disabled="isLoading" :loading="isLoading" />
                    </form>

                    <!-- Register link -->
                    <div class="mt-8 text-center">
                        <span class="text-muted-color">Chưa có tài khoản? </span>
                        <span class="cursor-pointer font-medium text-primary hover:underline" @click="goToRegister"> Đăng ký ngay </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}

.p-invalid {
    border-color: var(--red-500) !important;
}

.p-invalid:focus {
    border-color: var(--red-500) !important;
    box-shadow: 0 0 0 0.2rem rgba(239, 68, 68, 0.2) !important;
}
</style>
