import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // ROUTE USER - Trang chủ người dùng (KHÔNG CẦN ĐĂNG NHẬP)
        {
            path: '/',
            name: 'user-home',
            component: () => import('@/views/user/UserHome.vue')
        },

        // ADMIN ROUTES - CẦN ĐĂNG NHẬP VÀ LÀ ADMIN/NHÂN VIÊN
        {
            path: '/admin',
            component: AppLayout,
            meta: { requiresAuth: true, roles: ['admin', 'nhanvien'] },
            children: [
                {
                    path: '/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/views/uikit/FormLayout.vue')
                },
                {
                    path: '/uikit/input',
                    name: 'input',
                    component: () => import('@/views/uikit/InputDoc.vue')
                },
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/views/uikit/ButtonDoc.vue')
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/views/uikit/TableDoc.vue')
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/views/uikit/ListDoc.vue')
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/views/uikit/TreeDoc.vue')
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/views/uikit/PanelsDoc.vue')
                },
                {
                    path: '/uikit/overlay',
                    name: 'overlay',
                    component: () => import('@/views/uikit/OverlayDoc.vue')
                },
                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/views/uikit/MediaDoc.vue')
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/views/uikit/MessagesDoc.vue')
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/views/uikit/FileDoc.vue')
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/views/uikit/MenuDoc.vue')
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/ChartDoc.vue')
                },
                {
                    path: '/uikit/misc',
                    name: 'misc',
                    component: () => import('@/views/uikit/MiscDoc.vue')
                },
                {
                    path: '/uikit/timeline',
                    name: 'timeline',
                    component: () => import('@/views/uikit/TimelineDoc.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue')
                },
                {
                    path: '/pages/crud',
                    name: 'crud',
                    component: () => import('@/views/pages/Crud.vue')
                },
                {
                    path: '/documentation',
                    name: 'documentation',
                    component: () => import('@/views/pages/Documentation.vue')
                },
                {
                    name: 'SanPham',
                    path: '/san-pham',
                    component: () => import('@/views/sanpham/SanPhamList.vue')
                },
                {
                    name: 'HoaDon',
                    path: '/hoa-don',
                    component: () => import('@/views/HoaDon/ViewHoaDon.vue')
                },
                {
                    name: 'NhanVien',
                    path: '/nhan-vien',
                    component: () => import('@/views/TaiKhoan/NhanVien/NhanVienView.vue')
                },
                {
                    name: 'KhachHang',
                    path: '/khach-hang',
                    component: () => import('@/views/TaiKhoan/KhachHang/KhachHangView.vue')
                },
                {
                    name: 'ChatLieu',
                    path: '/chat-lieu',
                    component: () => import('@/views/ThuocTinh/ChatLieu/ChatLieuView.vue')
                },
                {
                    name: 'DanhMuc',
                    path: '/danh-muc',
                    component: () => import('@/views/ThuocTinh/DanhMuc/DanhMucView.vue')
                },
                {
                    name: 'DeGiay',
                    path: '/de-giay',
                    component: () => import('@/views/ThuocTinh/DeGiay/DeGiayView.vue')
                },
                {
                    name: 'ThuongHieu',
                    path: '/thuong-hieu',
                    component: () => import('@/views/ThuocTinh/ThuongHieu/ThuongHieuView.vue')
                },
                {
                    name: 'MauSac',
                    path: '/mau-sac',
                    component: () => import('@/views/ThuocTinh/MauSac/MauSacView.vue')
                },
                {
                    name: 'KichCo',
                    path: '/kich-co',
                    component: () => import('@/views/ThuocTinh/KichCo/KichCoView.vue')
                },
                {
                    name: 'ThongBaoList',
                    path: '/thong-bao',
                    component: () => import('@/views/ThongBao/ThongBaoList.vue')
                },
                {
                    name: 'Voucher',
                    path: '/voucher',
                    component: () => import('@/views/Voucher/VoucherList.vue')
                },
                {
                    name: 'KhuyenMai',
                    path: '/khuyen-mai',
                    component: () => import('@/views/KhuyenMai/KhuyenMaiList.vue')
                },
                {
                    name: 'HinhAnh',
                    path: '/hinh-anh',
                    component: () => import('@/views/HinhAnh/HinhAnhView.vue')
                },
                {
                    name: 'TaiKhoan',
                    path: '/tai-khoan',
                    component: () => import('@/views/TaiKhoan/TaiKhoanManagement.vue')
                },
                {
                    name: 'BanHang',
                    path: '/ban-hang',
                    component: () => import('@/views/BanHang/BanHangView.vue')
                }
            ]
        },

        // CÁC ROUTE KHÁC - Giữ nguyên
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        },

        // AUTH ROUTES
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        }
    ]
});

// // ROUTE GUARDS - Kiểm tra quyền truy cập
// router.beforeEach((to, from, next) => {
//     // Lấy thông tin user từ localStorage hoặc store
//     const token = localStorage.getItem('token');
//     const userRole = localStorage.getItem('role'); // 'admin', 'nhanvien', 'khachhang'

//     // Nếu route cần đăng nhập
//     if (to.meta.requiresAuth) {
//         if (!token) {
//             // Chưa đăng nhập -> chuyển đến login
//             next('/auth/login');
//             return;
//         }

//         // Đã đăng nhập, kiểm tra role
//         if (to.meta.roles && !to.meta.roles.includes(userRole)) {
//             // Không có quyền truy cập
//             next('/auth/access');
//             return;
//         }
//     }

//     // Nếu đã đăng nhập và là admin/nhân viên, chuyển hướng từ login về admin
//     if (to.name === 'login' && token && ['admin', 'nhanvien'].includes(userRole)) {
//         next('/admin');
//         return;
//     }

//     // Nếu đã đăng nhập và là khách hàng, chuyển hướng từ login về trang chủ
//     if (to.name === 'login' && token && userRole === 'khachhang') {
//         next('/');
//         return;
//     }

//     next();
// });

export default router;
