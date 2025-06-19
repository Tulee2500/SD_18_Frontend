import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
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
                    name: 'SanPhamAdd',
                    path: '/san-pham/add',
                    component: () => import('@/views/sanpham/SanPhamAdd.vue')
                },
                {
                    name: 'SanPhamEdit',
                    path: '/san-pham/edit/:id',
                    component: () => import('@/views/sanpham/SanPhamEdit.vue')
                },
                {
                    name: 'SanPhamChiTiet',
                    path: '/san-pham/chi-tiet/:id',
                    component: () => import('@/views/sanpham/SanPhamChiTiet.vue')
                },
                {
                    name: 'SanPhamChiTietAdd',
                    path: '/san-pham/chi-tiet/add/:id',
                    component: () => import('@/views/sanpham/SanPhamChiTietAdd.vue')
                },
                {
                    name: 'SanPhamChiTietUpdate',
                    path: '/san-pham/chi-tiet/edit/:id',
                    component: () => import('@/views/sanpham/SanPhamChiTietEdit.vue')
                },
                {
                    name: 'NhanVien',
                    path: '/nhan-vien',
                    component: () => import('@/views/TaiKhoan/NhanVien/NhanVienView.vue')
                },
                {
                    name: 'NhanVienAdd',
                    path: '/nhan-vien/add',
                    component: () => import('@/views/TaiKhoan/NhanVien/NhanVienAdd.vue')
                },
                {
                    name: 'NhanVienUpdate',
                    path: '/nhan-vien/update/:id',
                    component: () => import('@/views/TaiKhoan/NhanVien/NhanVienUpdate.vue')
                },
                {
                    name: 'KhachHang',
                    path: '/khach-hang',
                    component: () => import('@/views/TaiKhoan/KhachHang/KhachHangView.vue')
                },
                {
                    name: 'KhachHangAdd',
                    path: '/khach-hang/add',
                    component: () => import('@/views/TaiKhoan/KhachHang/KhachHangAdd.vue')
                },
                {
                    name: 'KhachHangUpdate',
                    path: '/khach-hang/update/:id',
                    component: () => import('@/views/TaiKhoan/KhachHang/KhachHangUpdate.vue')
                },
                {
                    name: 'ChatLieu',
                    path: '/chat-lieu',
                    component: () => import('@/views/ThuocTinh/ChatLieu/ChatLieuView.vue')
                },
                {
                    name: 'ChatLieuAdd',
                    path: '/chat-lieu/add',
                    component: () => import('@/views/ThuocTinh/ChatLieu/ChatLieuAdd.vue')
                },
                {
                    name: 'ChatLieuUpdate',
                    path: '/chat-lieu/update/:id',
                    component: () => import('@/views/ThuocTinh/ChatLieu/ChatLieuUpdate.vue')
                },
                {
                    name: 'DanhMuc',
                    path: '/danh-muc',
                    component: () => import('@/views/ThuocTinh/DanhMuc/DanhMucView.vue')
                },
                {
                    name: 'DanhMucAdd',
                    path: '/danh-muc/add',
                    component: () => import('@/views/ThuocTinh/DanhMuc/DanhMucAdd.vue')
                },
                {
                    name: 'DanhMucUpdate',
                    path: '/danh-muc/update/:id',
                    component: () => import('@/views/ThuocTinh/DanhMuc/DanhMucUpdate.vue')
                },
                {
                    name: 'DeGiay',
                    path: '/de-giay',
                    component: () => import('@/views/ThuocTinh/DeGiay/DeGiayView.vue')
                },
                {
                    name: 'DeGiayAdd',
                    path: '/de-giay/add',
                    component: () => import('@/views/ThuocTinh/DeGiay/DeGiayAdd.vue')
                },
                {
                    name: 'DeGiayUpdate',
                    path: '/de-giay/update/:id',
                    component: () => import('@/views/ThuocTinh/DeGiay/DeGiayUpdate.vue')
                },
                {
                    name: 'ThuongHieu',
                    path: '/thuong-hieu',
                    component: () => import('@/views/ThuocTinh/ThuongHieu/ThuongHieuView.vue')
                },
                {
                    name: 'ThuongHieuAdd',
                    path: '/thuong-hieu/add',
                    component: () => import('@/views/ThuocTinh/ThuongHieu/ThuongHieuAdd.vue')
                },
                {
                    name: 'ThuongHieuUpdate',
                    path: '/thuong-hieu/update/:id',
                    component: () => import('@/views/ThuocTinh/ThuongHieu/ThuongHieuUpdate.vue')
                },
                {
                    name: 'MauSac',
                    path: '/mau-sac',
                    component: () => import('@/views/ThuocTinh/MauSac/MauSacView.vue')
                },

                {
                    name: 'MauSacAdd',
                    path: '/mau-sac/add',
                    component: () => import('@/views/ThuocTinh/MauSac/MauSacAdd.vue')
                },
                {
                    name: 'MauSacUpdate',
                    path: '/mau-sac/update/:id',
                    component: () => import('@/views/ThuocTinh/MauSac/MauSacUpdate.vue')
                },
                {
                    name: 'KichCo',
                    path: '/kich-co',
                    component: () => import('@/views/ThuocTinh/KichCo/KichCoView.vue')
                },
                {
                    name: 'KichCoAdd',
                    path: '/kich-co/add',
                    component: () => import('@/views/ThuocTinh/KichCo/KichCoAdd.vue')
                },
                {
                    name: 'KichCoUpdate',
                    path: '/kich-co/update/:id',
                    component: () => import('@/views/ThuocTinh/KichCo/KichCoUpdate.vue')
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
                }
            ]
        },
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
        }
    ]
});

export default router;
