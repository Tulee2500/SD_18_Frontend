<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { ref } from 'vue';
import { useAuthStore } from '@/store/auth'; // Import Pinia store
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const checked = ref(false);
const errorMessage = ref(''); // Thêm biến để lưu thông báo lỗi
const isLoading = ref(false); // Biến để quản lý trạng thái loading

const authStore = useAuthStore();
const router = useRouter();

const login = async () => {
    try {
        isLoading.value = true; // Bật trạng thái loading
        errorMessage.value = ''; // Reset thông báo lỗi

        // Gọi action login từ store
        await authStore.login(email.value, password.value);

        // Nếu đăng nhập thành công, chuyển hướng
        router.push(authStore.returnUrl || '/san-pham');
    } catch (error) {
        // Xử lý lỗi: hiển thị thông báo
        errorMessage.value = typeof error === 'string' ? error : 'Đăng nhập thất bại. Vui lòng thử lại.';
    } finally {
        isLoading.value = false; // Tắt trạng thái loading
    }
};
</script>

<template>
    <FloatingConfigurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-8 w-16 shrink-0 mx-auto">
                            <!-- ... (giữ nguyên) ... -->
                        </svg>
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome to PrimeLand!</div>
                        <span class="text-muted-color font-medium">Sign in to continue</span>
                    </div>

                    <!-- Hiển thị thông báo lỗi -->
                    <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {{ errorMessage }}
                    </div>

                    <div>
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                        <InputText id="email1" type="text" placeholder="Email address" class="w-full md:w-[30rem] mb-8" v-model="email" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">Remember me</label>
                            </div>
                            <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Forgot password?</span>
                        </div>

                        <!-- Nút đăng nhập với trạng thái loading -->
                        <Button label="Sign In" class="w-full" @click="login" :disabled="isLoading">
                            <span v-if="isLoading"> <i class="pi pi-spin pi-spinner mr-2"></i> Đang xử lý... </span>
                            <span v-else>Sign In</span>
                        </Button>
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
</style>
