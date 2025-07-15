<script setup>
import headerLogo from '@/assets/images/header-logo.svg';
import { navLinks } from '@/constants/index.js';

import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// State
const cartItemCount = ref(3);
const secondNavOpen = ref(false);
const user = ref(null);
const isUserDropdownOpen = ref(false);

// Computed
const isLoggedIn = computed(() => !!user.value);
const userName = computed(() => {
    if (!user.value) return '';
    return user.value.email?.split('@')[0] || 'User';
});

// Methods
const navToggler = () => {
    secondNavOpen.value = !secondNavOpen.value;
};

const handleResize = () => {
    if (window.innerWidth > 1024) {
        secondNavOpen.value = true;
    } else {
        secondNavOpen.value = false;
    }
};

const loadUserData = () => {
    const userData = localStorage.getItem('user_info');
    if (userData) {
        try {
            user.value = JSON.parse(userData);
        } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem('user_info');
            localStorage.removeItem('auth_token');
        }
    }
};

const goToLogin = () => {
    router.push('/auth/login');
};

const goToCart = () => {
    router.push('/cart');
};

const goToProfile = () => {
    router.push('/profile');
    isUserDropdownOpen.value = false;
};

const logout = async () => {
    try {
        console.log('🔄 Starting logout process...');

        // Đóng dropdown
        isUserDropdownOpen.value = false;

        // Gọi API logout
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                await fetch('http://localhost:8080/auth/logout', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
            } catch (apiError) {
                console.log('⚠️ Logout API call failed:', apiError.message);
            }
        }

        // Clear localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');

        // Reset state
        user.value = null;

        // Redirect to home
        router.push('/');
    } catch (error) {
        console.error('❌ Logout error:', error);

        // Force cleanup
        localStorage.clear();
        user.value = null;
        router.push('/');
    }
};

const toggleUserDropdown = () => {
    isUserDropdownOpen.value = !isUserDropdownOpen.value;
};

// Click outside to close dropdown
const handleClickOutside = (event) => {
    const dropdown = document.querySelector('.user-dropdown');
    const userButton = document.querySelector('.user-button');

    if (dropdown && !dropdown.contains(event.target) && !userButton.contains(event.target)) {
        isUserDropdownOpen.value = false;
    }
};

onMounted(() => {
    handleResize();
    loadUserData();
    window.addEventListener('resize', handleResize);
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
    <header class="padding-x absolute z-50 w-full py-8">
        <nav class="flex items-center justify-between">
            <div class="flex w-full flex-col justify-between lg:flex-row lg:items-center">
                <a href="/" class="left-5">
                    <img :src="headerLogo" alt="Logo" width="150" height="29" />
                </a>

                <!-- Navigation Menu -->
                <ul
                    class="flex flex-1 items-center justify-center gap-16 transition duration-500 max-lg:absolute max-lg:left-0 max-lg:top-full max-lg:w-full max-lg:flex-col max-lg:items-start max-lg:gap-3 max-lg:bg-white max-lg:py-5 max-lg:shadow-lg"
                    :class="{
                        'max-lg:hidden': !secondNavOpen,
                        'max-lg:flex': secondNavOpen
                    }"
                >
                    <li class="font-montserrat text-lg leading-normal text-slate-600 transition-colors hover:text-slate-800" v-for="navLink in navLinks" :key="navLink.label">
                        <a :href="navLink.href" v-smooth-scroll>{{ navLink.label }}</a>
                    </li>
                </ul>

                <!-- Cart and User Section -->
                <div class="flex items-center gap-6 max-lg:absolute max-lg:right-16 max-lg:top-4">
                    <!-- Shopping Cart Icon -->
                    <div class="group relative cursor-pointer rounded-lg p-2 transition-colors duration-300 hover:bg-slate-100" @click="goToCart">
                        <svg class="h-6 w-6 text-slate-600 transition-colors group-hover:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8" />
                        </svg>
                        <!-- Cart Badge -->
                        <span v-if="cartItemCount > 0" class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md">
                            {{ cartItemCount }}
                        </span>
                    </div>

                    <!-- User Icon/Dropdown -->
                    <div class="relative">
                        <!-- Not Logged In -->
                        <div v-if="!isLoggedIn" class="group cursor-pointer rounded-lg p-2 transition-colors duration-300 hover:bg-slate-100" @click="goToLogin">
                            <svg class="h-6 w-6 text-slate-600 transition-colors group-hover:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>

                        <!-- Logged In -->
                        <div v-else>
                            <!-- User Button -->
                            <div class="user-button group cursor-pointer rounded-lg p-2 transition-colors duration-300 hover:bg-slate-100" @click="toggleUserDropdown">
                                <div class="flex items-center gap-2">
                                    <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                                        {{ userName.charAt(0).toUpperCase() }}
                                    </div>
                                    <span class="hidden text-sm font-medium text-slate-600 sm:block">{{ userName }}</span>
                                    <svg class="h-4 w-4 text-slate-600 transition-transform duration-200" :class="{ 'rotate-180': isUserDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            <!-- User Dropdown -->
                            <div v-if="isUserDropdownOpen" class="user-dropdown absolute right-0 z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg" @click.stop>
                                <!-- User Info Header -->
                                <div class="border-b border-gray-100 px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
                                            {{ userName.charAt(0).toUpperCase() }}
                                        </div>
                                        <div>
                                            <div class="font-medium text-gray-900">{{ userName }}</div>
                                            <div class="text-sm text-gray-500">{{ user.email }}</div>
                                            <div class="text-xs font-medium text-blue-600">{{ user.vaiTro }}</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Menu Items -->
                                <div class="py-2">
                                    <!-- <button
                    @click="goToProfile"
                    class="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Thông tin cá nhân</span>
                  </button> -->

                                    <!-- Admin/NhanVien Dashboard -->
                                    <!-- <button
                    v-if="user.vaiTro === 'ADMIN' || user.vaiTro === 'NHANVIEN'"
                    @click="router.push('/dashboard'); isUserDropdownOpen = false;"
                    class="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Quản trị</span>
                  </button> -->

                                    <div class="my-1 border-t border-gray-100"></div>

                                    <!-- Logout Button -->
                                    <button @click="logout" class="flex w-full items-center gap-3 px-4 py-2 text-left text-red-600 transition-colors hover:bg-red-50">
                                        <svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Hamburger Menu -->
            <div class="relative z-10 hidden cursor-pointer flex-col gap-1 p-2 max-lg:flex" @click="navToggler">
                <span
                    class="h-[2px] w-6 bg-slate-600 transition-all duration-300 ease-in-out"
                    :class="{
                        'translate-y-[6px] rotate-45': secondNavOpen,
                        'translate-y-0 rotate-0': !secondNavOpen
                    }"
                ></span>
                <span
                    class="h-[2px] w-6 bg-slate-600 transition-all duration-300 ease-in-out"
                    :class="{
                        'opacity-0': secondNavOpen,
                        'opacity-100': !secondNavOpen
                    }"
                ></span>
                <span
                    class="h-[2px] w-6 bg-slate-600 transition-all duration-300 ease-in-out"
                    :class="{
                        '-translate-y-[6px] -rotate-45': secondNavOpen,
                        'translate-y-0 rotate-0': !secondNavOpen
                    }"
                ></span>
            </div>
        </nav>
    </header>
</template>

<style lang="css" scoped>
/* Custom styles */
.padding-x {
    padding-left: 1rem;
    padding-right: 1rem;
}

@media (min-width: 1024px) {
    .padding-x {
        padding-left: 2rem;
        padding-right: 2rem;
    }
}

/* Dropdown animation */
.user-dropdown {
    animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
