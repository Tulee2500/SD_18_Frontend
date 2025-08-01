<script setup>
import headerLogo from '@/assets/images/header-logo.svg';
import { navLinks } from '@/constants/index.js';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

// State
const cartItemCount = ref(3);
const secondNavOpen = ref(false);
const user = ref(null);
const isUserDropdownOpen = ref(false);
const isScrolled = ref(false);
const searchQuery = ref('');
const isSearchFocused = ref(false);

// Computed
const isLoggedIn = computed(() => !!user.value);
const userName = computed(() => {
    if (!user.value) return '';
    return user.value.ten || user.value.email?.split('@')[0] || 'User';
});

const userInitial = computed(() => {
    return userName.value.charAt(0).toUpperCase();
});

const userRole = computed(() => {
    if (!user.value) return '';
    const roles = {
        'ADMIN': 'Quản trị viên',
        'NHANVIEN': 'Nhân viên',
        'USER': 'Khách hàng'
    };
    return roles[user.value.vaiTro] || user.value.vaiTro;
});

const isActiveRoute = (href) => {
    return route.path === href;
};

// Methods
const navToggler = () => {
    secondNavOpen.value = !secondNavOpen.value;
    // Prevent body scroll when mobile menu is open
    document.body.style.overflow = secondNavOpen.value ? 'hidden' : '';
};

const handleResize = () => {
    if (window.innerWidth > 1024) {
        secondNavOpen.value = false;
        document.body.style.overflow = '';
    }
};

const handleScroll = () => {
    isScrolled.value = window.scrollY > 20;
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

const handleSearch = () => {
    if (searchQuery.value.trim()) {
        router.push({
            path: '/products',
            query: { search: searchQuery.value.trim() }
        });
        searchQuery.value = '';
        isSearchFocused.value = false;
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

const goToOrders = () => {
    router.push('/orders');
    isUserDropdownOpen.value = false;
};

const goToDashboard = () => {
    router.push('/dashboard');
    isUserDropdownOpen.value = false;
};

const logout = async () => {
    try {
        isUserDropdownOpen.value = false;

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
                console.log('Logout API call failed:', apiError.message);
            }
        }

        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');

        user.value = null;
        router.push('/');
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.clear();
        user.value = null;
        router.push('/');
    }
};

const toggleUserDropdown = () => {
    isUserDropdownOpen.value = !isUserDropdownOpen.value;
};

const handleClickOutside = (event) => {
    const dropdown = document.querySelector('.user-dropdown');
    const userButton = document.querySelector('.user-button');

    if (dropdown && !dropdown.contains(event.target) && !userButton.contains(event.target)) {
        isUserDropdownOpen.value = false;
    }
};

// Close mobile menu on route change
watch(() => route.path, () => {
    secondNavOpen.value = false;
    document.body.style.overflow = '';
});

onMounted(() => {
    handleResize();
    loadUserData();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('click', handleClickOutside);
    document.body.style.overflow = '';
});
</script>

<template>
    <header 
        class="fixed top-0 z-50 w-full transition-all duration-300"
        :class="[
            isScrolled ? 'bg-white shadow-lg' : 'bg-white/90 backdrop-blur-md',
            'border-b border-gray-100'
        ]"
    >
        <nav class="container mx-auto px-4 lg:px-8">
            <div class="flex h-20 items-center justify-between">
                <!-- Logo -->
                <router-link 
                    to="/" 
                    class="relative z-50 flex items-center space-x-2 transition-transform duration-300 hover:scale-105"
                >
                    <img 
                        :src="headerLogo" 
                        alt="Logo" 
                        class="h-12 w-auto"
                    />
                </router-link>

                <!-- Desktop Navigation -->
                <div class="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center">
                    <ul class="flex items-center space-x-8">
                        <li 
                            v-for="navLink in navLinks" 
                            :key="navLink.label"
                        >
                            <router-link
                                :to="navLink.href"
                                class="nav-link group relative py-2 text-base font-medium transition-colors"
                                :class="[
                                    isActiveRoute(navLink.href) 
                                        ? 'text-coral-red' 
                                        : 'text-gray-700 hover:text-coral-red'
                                ]"
                            >
                                {{ navLink.label }}
                                <span 
                                    class="absolute bottom-0 left-0 h-0.5 w-0 bg-coral-red transition-all duration-300 group-hover:w-full"
                                    :class="{ 'w-full': isActiveRoute(navLink.href) }"
                                ></span>
                            </router-link>
                        </li>
                    </ul>
                </div>

                <!-- Right Section -->
                <div class="flex items-center space-x-4">
                    <!-- Search Bar (Desktop) -->
                    <div class="hidden lg:block">
                        <div 
                            class="search-container relative transition-all duration-300"
                            :class="isSearchFocused ? 'w-64' : 'w-48'"
                        >
                            <input
                                v-model="searchQuery"
                                @keyup.enter="handleSearch"
                                @focus="isSearchFocused = true"
                                @blur="isSearchFocused = false"
                                type="text"
                                placeholder="Tìm kiếm..."
                                class="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 pr-10 text-sm outline-none transition-all duration-300 focus:border-coral-red focus:bg-white focus:shadow-md"
                            />
                            <button
                                @click="handleSearch"
                                class="absolute right-0 top-0 flex h-full items-center px-3 text-gray-400 transition-colors hover:text-coral-red"
                            >
                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Cart -->
                    <button
                        @click="goToCart"
                        class="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:bg-gray-100"
                    >
                        <svg class="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span 
                            v-if="cartItemCount > 0" 
                            class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral-red text-xs font-semibold text-white"
                        >
                            {{ cartItemCount }}
                        </span>
                    </button>

                    <!-- User Menu -->
                    <div class="relative">
                        <!-- Not Logged In -->
                        <button
                            v-if="!isLoggedIn"
                            @click="goToLogin"
                            class="flex h-10 items-center space-x-2 rounded-full bg-coral-red px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-red-600 hover:shadow-lg"
                        >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span class="hidden sm:inline">Đăng nhập</span>
                        </button>

                        <!-- Logged In -->
                        <div v-else>
                            <button
                                @click="toggleUserDropdown"
                                class="user-button flex h-10 items-center space-x-2 rounded-full border border-gray-200 bg-white px-3 py-2 transition-all duration-300 hover:border-gray-300 hover:shadow-md"
                            >
                                <div 
                                    class="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-white"
                                    :class="[
                                        user.vaiTro === 'ADMIN' ? 'bg-purple-500' :
                                        user.vaiTro === 'NHANVIEN' ? 'bg-blue-500' :
                                        'bg-green-500'
                                    ]"
                                >
                                    {{ userInitial }}
                                </div>
                                <span class="hidden text-sm font-medium text-gray-700 sm:inline">
                                    {{ userName }}
                                </span>
                                <svg 
                                    class="h-4 w-4 text-gray-400 transition-transform duration-200" 
                                    :class="{ 'rotate-180': isUserDropdownOpen }"
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <!-- Dropdown Menu -->
                            <Transition name="dropdown">
                                <div 
                                    v-if="isUserDropdownOpen" 
                                    class="user-dropdown absolute right-0 mt-2 w-72 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5"
                                >
                                    <!-- User Info Header -->
                                    <div class="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-4">
                                        <div class="flex items-center space-x-3">
                                            <div 
                                                class="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
                                                :class="[
                                                    user.vaiTro === 'ADMIN' ? 'bg-purple-500' :
                                                    user.vaiTro === 'NHANVIEN' ? 'bg-blue-500' :
                                                    'bg-green-500'
                                                ]"
                                            >
                                                {{ userInitial }}
                                            </div>
                                            <div class="flex-1">
                                                <div class="font-semibold text-gray-900">{{ userName }}</div>
                                                <div class="text-sm text-gray-600">{{ user.email }}</div>
                                                <div class="mt-1">
                                                    <span 
                                                        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                                        :class="[
                                                            user.vaiTro === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                            user.vaiTro === 'NHANVIEN' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'
                                                        ]"
                                                    >
                                                        {{ userRole }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Menu Items -->
                                    <div class="py-2">
                                        <button
                                            @click="goToProfile"
                                            class="flex w-full items-center space-x-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
                                        >
                                            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                                                <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div class="text-sm font-medium text-gray-900">Thông tin cá nhân</div>
                                                <div class="text-xs text-gray-500">Quản lý tài khoản của bạn</div>
                                            </div>
                                        </button>

                                        <button
                                            @click="goToOrders"
                                            class="flex w-full items-center space-x-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
                                        >
                                            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                                                <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div class="text-sm font-medium text-gray-900">Đơn hàng của tôi</div>
                                                <div class="text-xs text-gray-500">Theo dõi và quản lý đơn hàng</div>
                                            </div>
                                        </button>

                                        <!-- Admin/Staff Dashboard -->
                                        <button
                                            v-if="user.vaiTro === 'ADMIN' || user.vaiTro === 'NHANVIEN'"
                                            @click="goToDashboard"
                                            class="flex w-full items-center space-x-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
                                        >
                                            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                                                <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div class="text-sm font-medium text-gray-900">Trang quản trị</div>
                                                <div class="text-xs text-gray-500">Quản lý hệ thống</div>
                                            </div>
                                        </button>

                                        <div class="my-2 border-t border-gray-100"></div>

                                        <!-- Logout -->
                                        <button
                                            @click="logout"
                                            class="flex w-full items-center space-x-3 px-4 py-2.5 text-left transition-colors hover:bg-red-50"
                                        >
                                            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                                                <svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div class="text-sm font-medium text-red-600">Đăng xuất</div>
                                                <div class="text-xs text-red-500">Thoát khỏi tài khoản</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </Transition>
                        </div>
                    </div>

                    <!-- Mobile Menu Button -->
                    <button
                        @click="navToggler"
                        class="relative z-50 flex h-10 w-10 flex-col items-center justify-center rounded-lg transition-colors hover:bg-gray-100 lg:hidden"
                    >
                        <span
                            class="absolute h-0.5 w-5 transform bg-gray-700 transition-all duration-300"
                            :class="[
                                secondNavOpen ? 'rotate-45' : '-translate-y-1.5'
                            ]"
                        ></span>
                        <span
                            class="absolute h-0.5 w-5 bg-gray-700 transition-all duration-300"
                            :class="[
                                secondNavOpen ? 'opacity-0' : 'opacity-100'
                            ]"
                        ></span>
                        <span
                            class="absolute h-0.5 w-5 transform bg-gray-700 transition-all duration-300"
                            :class="[
                                secondNavOpen ? '-rotate-45' : 'translate-y-1.5'
                            ]"
                        ></span>
                    </button>
                </div>
            </div>
        </nav>

        <!-- Mobile Navigation -->
        <Transition name="mobile-menu">
            <div
                v-if="secondNavOpen"
                class="fixed inset-0 z-40 bg-white lg:hidden"
                style="top: 80px"
            >
                <div class="h-full overflow-y-auto px-4 pb-20 pt-8">
                    <!-- Mobile Search -->
                    <div class="mb-8">
                        <div class="relative">
                            <input
                                v-model="searchQuery"
                                @keyup.enter="handleSearch"
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                class="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-10 outline-none transition-all focus:border-coral-red focus:bg-white"
                            />
                            <button
                                @click="handleSearch"
                                class="absolute right-0 top-0 flex h-full items-center px-4 text-gray-400"
                            >
                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Mobile Nav Links -->
                    <nav class="space-y-1">
                        <router-link
                            v-for="navLink in navLinks"
                            :key="navLink.label"
                            :to="navLink.href"
                            class="mobile-nav-link block rounded-lg px-4 py-3 text-base font-medium transition-colors"
                            :class="[
                                isActiveRoute(navLink.href)
                                    ? 'bg-coral-red text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                            ]"
                        >
                            {{ navLink.label }}
                        </router-link>
                    </nav>

                    <!-- Mobile User Menu (if logged in) -->
                    <div v-if="isLoggedIn" class="mt-8 border-t border-gray-200 pt-8">
                        <div class="space-y-1">
                            <router-link
                                to="/profile"
                                class="block rounded-lg px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100"
                            >
                                Thông tin cá nhân
                            </router-link>
                            <router-link
                                to="/orders"
                                class="block rounded-lg px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100"
                            >
                                Đơn hàng của tôi
                            </router-link>
                            <router-link
                                v-if="user.vaiTro === 'ADMIN' || user.vaiTro === 'NHANVIEN'"
                                to="/dashboard"
                                class="block rounded-lg px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100"
                            >
                                Trang quản trị
                            </router-link>
                            <button
                                @click="logout"
                                class="block w-full rounded-lg px-4 py-3 text-left text-base font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </header>

    <!-- Spacer for fixed header -->
    <div class="h-20"></div>
</template>

<style scoped>
/* Transition for dropdown */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* Transition for mobile menu */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
    transition: all 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
    opacity: 0;
    transform: translateX(-100%);
}

/* Smooth underline animation */
.nav-link span {
    transform-origin: left;
}

/* Custom scrollbar for mobile menu */
@media (max-width: 1023px) {
    .mobile-menu ::-webkit-scrollbar {
        width: 4px;
    }

    .mobile-menu ::-webkit-scrollbar-track {
        background: #f3f4f6;
    }

    .mobile-menu ::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 2px;
    }
}

/* Coral red color */
.text-coral-red {
    color: #FF6452;
}

.bg-coral-red {
    background-color: #FF6452;
}

.border-coral-red {
    border-color: #FF6452;
}

.focus\:border-coral-red:focus {
    border-color: #FF6452;
}
</style>