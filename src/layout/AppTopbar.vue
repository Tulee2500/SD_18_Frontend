<!-- layout/AppTopbar.vue -->
<script setup>
import { useAuth } from '@/composables/useAuth';
import { useLayout } from '@/layout/composables/layout';
import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const { layoutConfig, onMenuToggle } = useLayout();
const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);
const router = useRouter();
const toast = useToast();

const { currentUser, userName, userRole, logout } = useAuth();

// Get role display name
const roleDisplayName = computed(() => {
  switch(userRole.value) {
    case 'TRUONG_PHONG': return 'Trưởng phòng';
    case 'NHAN_VIEN': return 'Nhân viên';
    case 'KHACH_HANG': return 'Khách hàng';
    default: return 'Người dùng';
  }
});

// Get role badge severity
const roleBadgeSeverity = computed(() => {
  switch(userRole.value) {
    case 'TRUONG_PHONG': return 'danger';
    case 'NHAN_VIEN': return 'info';
    case 'KHACH_HANG': return 'success';
    default: return 'secondary';
  }
});

onMounted(() => {
    bindOutsideClickListener();
});

onBeforeUnmount(() => {
    unbindOutsideClickListener();
});

const logoUrl = computed(() => {
    return `/layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});

const onTopBarMenuButton = () => {
    topbarMenuActive.value = !topbarMenuActive.value;
};

const onSettingsClick = () => {
    topbarMenuActive.value = false;
    router.push('/profile');
};

const handleLogout = async () => {
    try {
        await logout();
        toast.add({
            severity: 'info',
            summary: 'Đã đăng xuất',
            detail: 'Hẹn gặp lại!',
            life: 3000
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
};

const topbarMenuClasses = computed(() => {
    return {
        'layout-topbar-menu-mobile-active': topbarMenuActive.value
    };
});

const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                topbarMenuActive.value = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
};

const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
};

const isOutsideClicked = (event) => {
    if (!topbarMenuActive.value) return;

    const sidebarEl = document.querySelector('.layout-topbar-menu');
    const topbarEl = document.querySelector('.layout-topbar-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};
</script>

<template>
    <div class="layout-topbar">
        <router-link to="/" class="layout-topbar-logo">
            <img :src="logoUrl" alt="logo" />
            <span>Sneaker Shop</span>
        </router-link>

        <button class="p-link layout-menu-button layout-topbar-button" @click="onMenuToggle()">
            <i class="pi pi-bars"></i>
        </button>

        <button class="p-link layout-topbar-menu-button layout-topbar-button" @click="onTopBarMenuButton()">
            <i class="pi pi-ellipsis-v"></i>
        </button>

        <div class="layout-topbar-menu" :class="topbarMenuClasses">
            <!-- User Info -->
            <div class="flex align-items-center px-3 py-2 border-bottom-1 surface-border">
                <div class="flex align-items-center">
                    <div class="flex align-items-center justify-content-center bg-primary border-circle mr-3" 
                         style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-user text-lg"></i>
                    </div>
                    <div>
                        <div class="font-medium">{{ userName }}</div>
                        <div class="flex align-items-center mt-1">
                            <Badge :value="roleDisplayName" :severity="roleBadgeSeverity" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Menu Items -->
            <button @click="onSettingsClick()" class="p-link layout-topbar-button">
                <i class="pi pi-cog"></i>
                <span>Cài đặt</span>
            </button>
            <button @click="router.push('/profile')" class="p-link layout-topbar-button">
                <i class="pi pi-user"></i>
                <span>Thông tin cá nhân</span>
            </button>
            
            <!-- Switch to User Site (for Employee/Manager) -->
            <button v-if="userRole === 'NHAN_VIEN' || userRole === 'TRUONG_PHONG'" 
                    @click="router.push('/user')" 
                    class="p-link layout-topbar-button">
                <i class="pi pi-shopping-cart"></i>
                <span>Trang mua hàng</span>
            </button>

            <!-- Logout -->
            <button @click="handleLogout" class="p-link layout-topbar-button text-red-500">
                <i class="pi pi-sign-out"></i>
                <span>Đăng xuất</span>
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped></style>