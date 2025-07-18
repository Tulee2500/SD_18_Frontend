<template>
    <div class="pos-container">
        <!-- Toast Notifications -->
        <div class="toast-container position-fixed end-0 top-0 p-3" style="z-index: 1100">
            <div v-if="showToast" class="toast show" :class="{ 'text-bg-success': toastType === 'success', 'text-bg-danger': toastType === 'error' }">
                <div class="toast-body">
                    {{ toastMessage }}
                </div>
            </div>
        </div>

        <div class="pos-layout d-flex">
            <!-- Left Panel - Products -->
            <div class="left-panel col-lg-8 border-end bg-light">
                <!-- Header -->
                <div class="bg-primary p-3 text-white">
                    <div class="row align-items-center g-3">
                        <div class="col-auto">
                            <h4 class="mb-0">
                                <i class="bi bi-shop me-2"></i>
                                Bán Hàng Tại Quầy
                            </h4>
                        </div>

                        <div class="col">
                            <div class="input-group">
                                <input ref="searchInput" v-model="searchKeyword" @input="debounceSearch" type="text" placeholder="Tìm sản phẩm hoặc quét mã QR..." class="form-control" />
                                <button @click="showQrScanner = true" class="btn btn-outline-light">
                                    <i class="bi bi-qr-code-scan"></i>
                                </button>
                                <button @click="timKiemSanPham(0)" class="btn btn-light">
                                    <i class="bi bi-search"></i>
                                </button>
                            </div>
                        </div>

                        <div class="col-auto">
                            <div class="text-center">
                                <small class="d-block opacity-75">Tìm thấy</small>
                                <strong>{{ tongSoPhanTu }} sản phẩm</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="bg-info p-3 text-white">
                    <div class="row g-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small mb-1">Danh mục</label>
                            <select v-model="filters.danhMucId" @change="applyFilters" class="form-select form-select-sm">
                                <option value="">Tất cả danh mục</option>
                                <option v-for="dm in danhSachDanhMuc" :key="dm.id" :value="dm.id">
                                    {{ dm.tenDanhMuc }}
                                </option>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label small mb-1">Thương hiệu</label>
                            <select v-model="filters.thuongHieuId" @change="applyFilters" class="form-select form-select-sm">
                                <option value="">Tất cả thương hiệu</option>
                                <option v-for="th in danhSachThuongHieu" :key="th.id" :value="th.id">
                                    {{ th.tenThuongHieu }}
                                </option>
                            </select>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label small mb-1">Khoảng giá</label>
                            <div class="input-group input-group-sm">
                                <input v-model="filters.minPrice" @input="debouncePriceFilter" type="number" placeholder="Từ" class="form-control" />
                                <span class="input-group-text">-</span>
                                <input v-model="filters.maxPrice" @input="debouncePriceFilter" type="number" placeholder="Đến" class="form-control" />
                            </div>
                        </div>

                        <div class="col-md-2">
                            <button @click="resetFilters" class="btn btn-light btn-sm w-100"><i class="bi bi-arrow-clockwise me-1"></i>Reset</button>
                        </div>
                    </div>

                    <!-- Employee Info -->
                    <div class="row mt-3">
                        <div class="col">
                            <div class="card border-0 bg-white bg-opacity-25">
                                <div class="card-body p-2">
                                    <div class="row text-center">
                                        <div class="col">
                                            <small class="d-block opacity-75">Nhân viên</small>
                                            <strong class="small">{{ nhanVienInfo.tenNhanVien || 'Nhân viên' }}</strong>
                                        </div>
                                        <div class="col">
                                            <small class="d-block opacity-75">Mã NV</small>
                                            <strong class="small">{{ nhanVienInfo.maNhanVien || '001' }}</strong>
                                        </div>
                                        <div class="col">
                                            <small class="d-block opacity-75">Sản phẩm</small>
                                            <strong class="small">{{ danhSachSanPham.length }}/{{ tongSoPhanTu }}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Products Section -->
                <div class="flex-grow-1 p-3" style="height: calc(100vh - 200px); overflow-y: auto">
                    <!-- Loading -->
                    <div v-if="loading" class="py-5 text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Đang tải...</span>
                        </div>
                        <p class="text-muted mt-3">Đang tải sản phẩm...</p>
                    </div>

                    <!-- Error -->
                    <div v-if="error" class="alert alert-danger text-center">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        {{ error }}
                        <button @click="timKiemSanPham(0)" class="btn btn-outline-danger btn-sm mt-2"><i class="bi bi-arrow-clockwise me-1"></i>Thử lại</button>
                    </div>

                    <!-- Products -->
                    <div v-if="!loading && !error">
                        <!-- Empty State -->
                        <div v-if="danhSachSanPham.length === 0" class="py-5 text-center">
                            <i class="bi bi-search display-1 text-muted"></i>
                            <h5 class="mt-3">Không tìm thấy sản phẩm</h5>
                            <p class="text-muted">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                        </div>

                        <!-- Products Grid -->
                        <div v-else class="row g-3">
                            <div v-for="product in danhSachSanPham" :key="product.id" class="col-md-6">
                                <div class="card product-card h-100" @click="xemChiTietSanPham(product)" style="cursor: pointer">
                                    <div class="position-relative" style="height: 220px; overflow: hidden">
                                        <img :src="getProductImage(product)" :alt="product.tenSanPham" @error="handleImageError" class="card-img-top w-100 h-100" style="object-fit: cover" />

                                        <!-- Discount Badge - Top Left -->
                                        <div v-if="product.giaGoc && product.giaGoc > product.giaBan" class="position-absolute start-0 top-0 m-2">
                                            <span class="badge bg-success">-{{ Math.round((1 - product.giaBan / product.giaGoc) * 100) }}%</span>
                                        </div>

                                        <!-- Stock Badge - Top Right -->
                                        <div class="position-absolute end-0 top-0 m-2">
                                            <span v-if="product.soLuong <= 0" class="badge bg-danger">Hết hàng</span>
                                            <span v-else-if="product.soLuong <= 5" class="badge bg-warning text-dark">Còn {{ product.soLuong }}</span>
                                        </div>
                                    </div>

                                    <div class="card-body p-3">
                                        <h6 class="card-title mb-3" :title="product.tenSanPham" style="height: 2.8rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; font-size: 1rem; font-weight: 600">
                                            {{ product.tenSanPham }}
                                        </h6>

                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <div class="d-flex align-items-center">
                                                <span class="rounded-circle me-2" :style="{ backgroundColor: getMauHex(product.mauSac?.tenMau), width: '18px', height: '18px', border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }"></span>
                                                <small class="text-muted">{{ product.mauSac?.tenMau || 'N/A' }}</small>
                                            </div>
                                            <span class="badge bg-light text-dark">Size: {{ product.kichCo?.tenKichCo || 'N/A' }}</span>
                                        </div>

                                        <div class="mb-3">
                                            <div class="d-flex align-items-baseline gap-2">
                                                <span class="h5 text-danger fw-bold mb-0">{{ formatPrice(product.giaBan) }}</span>
                                                <small v-if="product.giaGoc && product.giaGoc > product.giaBan" class="text-muted text-decoration-line-through">
                                                    {{ formatPrice(product.giaGoc) }}
                                                </small>
                                            </div>
                                        </div>

                                        <button @click.stop="themVaoHoaDon(product)" :disabled="product.soLuong <= 0" class="btn btn-sm w-100" :class="product.soLuong <= 0 ? 'btn-secondary' : 'btn-primary'">
                                            <i class="bi bi-cart-plus me-1"></i>
                                            {{ product.soLuong <= 0 ? 'Hết hàng' : 'Thêm vào hóa đơn' }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Pagination -->
                        <nav v-if="tongSoTrang > 1" class="mt-4">
                            <ul class="pagination justify-content-center">
                                <li class="page-item" :class="{ disabled: trangHienTai === 0 }">
                                    <a class="page-link" @click="chuyenTrang(trangHienTai - 1)" href="#" @click.prevent>
                                        <i class="bi bi-chevron-left"></i>
                                    </a>
                                </li>
                                <li class="page-item active">
                                    <span class="page-link">{{ trangHienTai + 1 }} / {{ tongSoTrang }}</span>
                                </li>
                                <li class="page-item" :class="{ disabled: trangHienTai >= tongSoTrang - 1 }">
                                    <a class="page-link" @click="chuyenTrang(trangHienTai + 1)" href="#" @click.prevent>
                                        <i class="bi bi-chevron-right"></i>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <!-- Right Panel - Invoice -->
            <div class="right-panel col-lg-4 bg-white">
                <!-- Invoice Tabs -->
                <div class="bg-primary p-2 text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex flex-grow-1 gap-1 overflow-auto">
                            <button
                                v-for="(hoaDon, index) in hoaDonCho"
                                :key="hoaDon.id"
                                class="btn btn-sm position-relative flex-shrink-0"
                                :class="hoaDonDangChon?.id === hoaDon.id ? 'btn-light text-dark' : 'btn-outline-light'"
                                @click="chonHoaDon(hoaDon)"
                            >
                                <i class="bi bi-file-text me-1"></i>
                                HĐ{{ index + 1 }}
                                <button
                                    v-if="hoaDonCho.length > 1"
                                    @click.stop="xoaHoaDon(hoaDon.id)"
                                    class="btn-close btn-close-white position-absolute"
                                    style="top: -5px; right: -5px; font-size: 0.6rem; padding: 0.1rem"
                                    :class="hoaDonDangChon?.id === hoaDon.id ? 'btn-close-dark' : 'btn-close-white'"
                                ></button>
                            </button>
                        </div>
                        <button @click="taoHoaDonMoi" class="btn btn-success btn-sm ms-2 flex-shrink-0"><i class="bi bi-plus-lg me-1"></i>Tạo HĐ</button>
                    </div>
                </div>

                <!-- Invoice Content -->
                <div v-if="hoaDonDangChon" class="p-3" style="height: calc(100vh - 60px); overflow-y: auto">
                    <!-- Customer Section -->
                    <div class="card mb-3">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="bi bi-person me-2"></i>Khách hàng</h6>
                            <button @click="showCustomerModal = true" class="btn btn-outline-primary btn-sm"><i class="bi bi-search me-1"></i>Chọn</button>
                        </div>
                        <div class="card-body">
                            <div v-if="khachHang" class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="fw-bold">{{ khachHang.hoTen }}</div>
                                    <small class="text-muted">{{ khachHang.sdt }}</small>
                                    <div class="small text-primary">Điểm tích lũy: {{ khachHang.diemTichLuy || 0 }}</div>
                                </div>
                                <button @click="boKhachHang" class="btn btn-outline-danger btn-sm">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            </div>
                            <div v-else class="text-muted text-center"><i class="bi bi-person me-2"></i>Khách lẻ</div>
                        </div>
                    </div>

                    <!-- Voucher Section -->
                    <div class="card mb-3">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="bi bi-ticket me-2"></i>Voucher</h6>
                            <button @click="showVoucherModal = true" class="btn btn-outline-success btn-sm"><i class="bi bi-search me-1"></i>Áp dụng</button>
                        </div>
                        <div class="card-body">
                            <div v-if="voucher" class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="fw-bold">{{ voucher.tenVoucher }}</div>
                                    <div class="text-success">Giảm {{ formatPrice(voucher.giaTriGiam) }}</div>
                                </div>
                                <button @click="boVoucher" class="btn btn-outline-danger btn-sm">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            </div>
                            <div v-else class="text-muted text-center"><i class="bi bi-ticket me-2"></i>Chưa có voucher</div>
                        </div>
                    </div>

                    <!-- Cart Items -->
                    <div class="card mb-3">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="bi bi-cart me-2"></i>Sản phẩm</h6>
                            <span class="badge bg-primary">{{ tongQuan.soLuongSanPham }} loại - {{ tongQuan.tongSoLuong }} sp</span>
                        </div>
                        <div class="card-body p-0">
                            <div v-if="sanPhamDaChon.length === 0" class="text-muted py-4 text-center">
                                <i class="bi bi-cart display-4"></i>
                                <p class="mt-2">Chưa có sản phẩm nào</p>
                            </div>
                            <div v-else style="max-height: 300px; overflow-y: auto">
                                <div v-for="item in sanPhamDaChon" :key="`cart-item-${item.id || item.chiTietSanPhamId}`" class="d-flex align-items-start border-bottom gap-3 p-3">
                                    <div class="position-relative flex-shrink-0" style="width: 50px; height: 50px">
                                        <img :src="getProductImage(item)" :alt="item.tenSanPham || 'Sản phẩm'" @error="handleImageError" class="w-100 h-100 rounded" style="object-fit: cover" />
                                        <div
                                            class="position-absolute rounded-circle bottom-0 end-0"
                                            :style="{ backgroundColor: getMauHex(item.mauSac?.tenMau), width: '12px', height: '12px', border: '2px solid white' }"
                                            :title="item.mauSac?.tenMau || 'N/A'"
                                        ></div>
                                    </div>

                                    <div class="flex-grow-1 min-w-0">
                                        <div class="d-flex justify-content-between align-items-start mb-1">
                                            <h6 class="text-truncate mb-0 pe-2" :title="item.tenSanPham || 'Sản phẩm'">
                                                {{ item.tenSanPham || 'Sản phẩm' }}
                                            </h6>
                                            <button @click="xoaKhoiGioHang(item)" class="btn btn-sm btn-outline-danger flex-shrink-0" title="Xóa sản phẩm">
                                                <i class="bi bi-x-lg" style="font-size: 0.75rem"></i>
                                            </button>
                                        </div>

                                        <div class="d-flex mb-2 flex-wrap gap-1">
                                            <span class="badge bg-info text-white">
                                                <span class="rounded-circle d-inline-block me-1" :style="{ backgroundColor: getMauHex(item.mauSac?.tenMau), width: '8px', height: '8px' }"></span>
                                                {{ item.mauSac?.tenMau || 'N/A' }}
                                            </span>
                                            <span class="badge bg-secondary">
                                                <i class="bi bi-rulers me-1" style="font-size: 0.75rem"></i>
                                                {{ item.kichCo?.tenKichCo || 'N/A' }}
                                            </span>
                                        </div>

                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <span class="fw-bold text-danger">{{ formatPrice(Number(item.giaBan) || 0) }}</span>
                                                <small v-if="item.giaGoc && Number(item.giaGoc) > Number(item.giaBan)" class="text-muted text-decoration-line-through ms-1">
                                                    {{ formatPrice(Number(item.giaGoc)) }}
                                                </small>
                                            </div>

                                            <div class="d-flex align-items-center gap-1">
                                                <button @click="giamSoLuong(item)" class="btn btn-outline-secondary btn-sm rounded-circle p-1" style="width: 28px; height: 28px" title="Giảm số lượng">
                                                    <i class="bi bi-dash"></i>
                                                </button>
                                                <span class="fw-bold mx-2">{{ Number(item.soLuongDaChon) || 0 }}</span>
                                                <button
                                                    @click="tangSoLuong(item)"
                                                    class="btn btn-outline-secondary btn-sm rounded-circle p-1"
                                                    style="width: 28px; height: 28px"
                                                    :disabled="(Number(item.soLuongDaChon) || 0) >= (Number(item.soLuong) || 999)"
                                                    title="Tăng số lượng"
                                                >
                                                    <i class="bi bi-plus"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Summary -->
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span>Tạm tính ({{ tongQuan.tongSoLuong }} sản phẩm):</span>
                                <span>{{ formatPrice(tongQuan.tongTienGoc) }}</span>
                            </div>
                            <div v-if="tongQuan.tongTienKhuyenMai < tongQuan.tongTienGoc" class="d-flex justify-content-between text-success mb-2">
                                <span>Khuyến mãi:</span>
                                <span>-{{ formatPrice(tongQuan.tongTienGoc - tongQuan.tongTienKhuyenMai) }}</span>
                            </div>
                            <div v-if="voucher" class="d-flex justify-content-between text-success mb-2">
                                <span>Voucher:</span>
                                <span>-{{ formatPrice(tongQuan.tongTienVoucher) }}</span>
                            </div>
                            <hr />
                            <div class="d-flex justify-content-between fw-bold h5">
                                <span>Tổng thanh toán:</span>
                                <span class="text-danger">{{ formatPrice(tongQuan.tongTienThanhToan) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Button -->
                    <button @click="showPaymentModal = true" :disabled="sanPhamDaChon.length === 0" class="btn w-100 btn-lg" :class="sanPhamDaChon.length === 0 ? 'btn-secondary' : 'btn-success'">
                        <i class="bi bi-credit-card me-2"></i>
                        Thanh toán ({{ formatPrice(tongQuan.tongTienThanhToan) }})
                    </button>
                </div>

                <!-- No Invoice Selected -->
                <div v-else class="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
                    <i class="bi bi-file-text display-1"></i>
                    <h5 class="mt-3">Chọn hoặc tạo hóa đơn</h5>
                    <button @click="taoHoaDonMoi" class="btn btn-primary mt-3"><i class="bi bi-plus-lg me-1"></i>Tạo hóa đơn mới</button>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <!-- Customer Selection Modal -->
        <div v-if="showCustomerModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-person me-2"></i>Chọn khách hàng</h5>
                        <button @click="showCustomerModal = false" type="button" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <div class="input-group">
                                <input v-model="customerSearchKeyword" @input="debounceCustomerSearch" type="text" placeholder="Tìm khách hàng theo tên hoặc SĐT" class="form-control" />
                                <button @click="showCreateCustomerForm = true" class="btn btn-success"><i class="bi bi-person-plus me-1"></i>Tạo mới</button>
                            </div>
                        </div>

                        <div style="max-height: 400px; overflow-y: auto">
                            <div v-if="loadingCustomers" class="py-4 text-center">
                                <div class="spinner-border text-primary" role="status"></div>
                                <p class="mt-2">Đang tìm kiếm...</p>
                            </div>

                            <div v-else-if="danhSachKhachHang.length === 0" class="text-muted py-4 text-center">
                                <i class="bi bi-people display-4"></i>
                                <p v-if="customerSearchKeyword" class="mt-2">Không tìm thấy khách hàng với từ khóa "{{ customerSearchKeyword }}"</p>
                                <p v-else class="mt-2">Chưa có khách hàng nào trong hệ thống</p>
                                <button
                                    v-if="customerSearchKeyword"
                                    @click="
                                        customerSearchKeyword = '';
                                        loadDanhSachKhachHang();
                                    "
                                    class="btn btn-outline-primary"
                                >
                                    Xem tất cả khách hàng
                                </button>
                            </div>

                            <div v-else class="list-group">
                                <button v-for="customer in danhSachKhachHang" :key="customer.id" @click="chonKhachHang(customer)" class="list-group-item list-group-item-action">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <div class="rounded-circle d-flex align-items-center justify-content-center me-3 bg-primary text-white" style="width: 40px; height: 40px">
                                                <i class="bi bi-person"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-1">{{ customer.hoTen }}</h6>
                                                <p class="text-muted mb-1">{{ customer.sdt }}</p>
                                                <small class="text-muted">{{ customer.email || 'Chưa có email' }}</small>
                                            </div>
                                        </div>
                                        <span class="badge bg-primary">{{ customer.diemTichLuy || 0 }} điểm</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showCustomerModal = false" class="btn btn-secondary">Đóng</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Customer Form Modal -->
        <div v-if="showCreateCustomerForm" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-person-plus me-2"></i>Tạo khách hàng mới</h5>
                        <button @click="showCreateCustomerForm = false" type="button" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Họ tên <span class="text-danger">*</span></label>
                            <input v-model="newCustomer.hoTen" type="text" placeholder="Nhập họ tên" class="form-control" :class="{ 'is-invalid': newCustomerErrors.hoTen }" />
                            <div v-if="newCustomerErrors.hoTen" class="invalid-feedback">{{ newCustomerErrors.hoTen }}</div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                            <input v-model="newCustomer.sdt" type="tel" placeholder="Nhập số điện thoại" class="form-control" :class="{ 'is-invalid': newCustomerErrors.sdt }" />
                            <div v-if="newCustomerErrors.sdt" class="invalid-feedback">{{ newCustomerErrors.sdt }}</div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input v-model="newCustomer.email" type="email" placeholder="Nhập email (không bắt buộc)" class="form-control" :class="{ 'is-invalid': newCustomerErrors.email }" />
                            <div v-if="newCustomerErrors.email" class="invalid-feedback">{{ newCustomerErrors.email }}</div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Địa chỉ</label>
                            <textarea v-model="newCustomer.diaChi" placeholder="Nhập địa chỉ (không bắt buộc)" class="form-control" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showCreateCustomerForm = false" class="btn btn-secondary">Hủy</button>
                        <button @click="taoKhachHangMoi" :disabled="loadingCreateCustomer" class="btn btn-primary" :class="{ 'btn-secondary': loadingCreateCustomer }">
                            <span v-if="loadingCreateCustomer" class="spinner-border spinner-border-sm me-2"></span>
                            {{ loadingCreateCustomer ? 'Đang tạo...' : 'Tạo khách hàng' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Voucher Selection Modal -->
        <div v-if="showVoucherModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-ticket me-2"></i>Áp dụng voucher</h5>
                        <button @click="showVoucherModal = false" type="button" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <div class="input-group">
                                <input v-model="voucherCode" type="text" placeholder="Nhập mã voucher" class="form-control" @keyup.enter="kiemTraVoucher" />
                                <button @click="kiemTraVoucher" :disabled="!voucherCode.trim() || loadingVoucherCheck" class="btn btn-success">
                                    <span v-if="loadingVoucherCheck" class="spinner-border spinner-border-sm me-2"></span>
                                    {{ loadingVoucherCheck ? 'Đang kiểm tra...' : 'Kiểm tra' }}
                                </button>
                            </div>
                        </div>

                        <div style="max-height: 400px; overflow-y: auto">
                            <div v-if="loadingVouchers" class="py-4 text-center">
                                <div class="spinner-border text-success" role="status"></div>
                                <p class="mt-2">Đang tải voucher...</p>
                            </div>

                            <div v-else-if="danhSachVoucher.length === 0" class="text-muted py-4 text-center">
                                <i class="bi bi-ticket display-4"></i>
                                <p v-if="khachHang" class="mt-2">Không có voucher khả dụng cho khách hàng này</p>
                                <p v-else-if="tongQuan.tongTienKhuyenMai > 0" class="mt-2">Không có voucher phù hợp với đơn hàng {{ formatPrice(tongQuan.tongTienKhuyenMai) }}</p>
                                <p v-else class="mt-2">Không có voucher khả dụng</p>
                                <button @click="layDanhSachVoucher()" class="btn btn-outline-success">Tải lại voucher</button>
                            </div>

                            <div v-else class="list-group">
                                <button v-for="voucher_item in danhSachVoucher" :key="voucher_item.id" @click="chonVoucher(voucher_item)" class="list-group-item list-group-item-action">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <div class="bg-success d-flex align-items-center justify-content-center me-3 rounded text-white" style="width: 48px; height: 48px">
                                                <i class="bi bi-ticket"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-1">{{ voucher_item.tenVoucher }}</h6>
                                                <p class="text-muted mb-1">{{ voucher_item.moTa || 'Không có mô tả' }}</p>
                                                <small class="text-success">Đơn tối thiểu: {{ formatPrice(voucher_item.giaTriDonHangToiThieu || 0) }}</small>
                                            </div>
                                        </div>
                                        <div class="text-end">
                                            <span class="badge bg-success fs-6">{{ formatPrice(voucher_item.giaTriGiam) }}</span>
                                            <div class="small text-muted">HSD: {{ formatDate(voucher_item.ngayKetThuc) }}</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showVoucherModal = false" class="btn btn-secondary">Đóng</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- QR Scanner Modal -->
        <div v-if="showQrScanner" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-qr-code-scan me-2"></i>Quét mã QR</h5>
                        <button @click="showQrScanner = false" type="button" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <input ref="qrInput" v-model="qrCode" type="text" placeholder="Nhập hoặc quét mã QR sản phẩm" @keyup.enter="quetQR" class="form-control" />
                        </div>
                        <button @click="quetQR" :disabled="!qrCode.trim()" class="btn btn-primary w-100"><i class="bi bi-search me-1"></i>Tìm sản phẩm</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Product Detail Modal -->
        <div v-if="showProductDetail" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-eye me-2"></i>Chi tiết sản phẩm</h5>
                        <button @click="showProductDetail = false" type="button" class="btn-close"></button>
                    </div>
                    <div class="modal-body" v-if="sanPhamDangXem">
                        <div class="row">
                            <div class="col-md-6">
                                <img :src="getProductImage(sanPhamDangXem)" :alt="sanPhamDangXem.tenSanPham" class="img-fluid rounded shadow" />
                            </div>
                            <div class="col-md-6">
                                <h2 class="mb-3">{{ sanPhamDangXem.tenSanPham }}</h2>
                                <h3 class="text-danger mb-3">{{ formatPrice(sanPhamDangXem.giaBan) }}</h3>

                                <div v-if="sanPhamDangXem.giaGoc && sanPhamDangXem.giaGoc > sanPhamDangXem.giaBan" class="d-flex align-items-center mb-3 gap-3">
                                    <span class="text-muted text-decoration-line-through h5">{{ formatPrice(sanPhamDangXem.giaGoc) }}</span>
                                    <span class="badge bg-success">Giảm {{ Math.round((1 - sanPhamDangXem.giaBan / sanPhamDangXem.giaGoc) * 100) }}%</span>
                                </div>

                                <div class="row mb-4">
                                    <div class="col-sm-6">
                                        <div class="mb-3">
                                            <label class="form-label text-muted">Màu sắc</label>
                                            <div class="d-flex align-items-center">
                                                <div
                                                    class="rounded-circle me-2"
                                                    style="width: 24px; height: 24px; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1)"
                                                    :style="{ backgroundColor: getMauHex(sanPhamDangXem.mauSac?.tenMau) }"
                                                ></div>
                                                <span>{{ sanPhamDangXem.mauSac?.tenMau || 'Chưa có' }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-sm-6">
                                        <div class="mb-3">
                                            <label class="form-label text-muted">Kích cỡ</label>
                                            <div>
                                                <span class="badge bg-light text-dark fs-6">{{ sanPhamDangXem.kichCo?.tenKichCo || 'Chưa có' }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-sm-6">
                                        <div class="mb-3">
                                            <label class="form-label text-muted">Thương hiệu</label>
                                            <div>{{ sanPhamDangXem.thuongHieu?.tenThuongHieu || 'Chưa có' }}</div>
                                        </div>
                                    </div>

                                    <div class="col-sm-6">
                                        <div class="mb-3">
                                            <label class="form-label text-muted">Tồn kho</label>
                                            <div>
                                                <span class="badge" :class="getStockBadgeClass(sanPhamDangXem.soLuong)"> {{ sanPhamDangXem.soLuong }} sản phẩm </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <label class="form-label">Số lượng</label>
                                    <div class="d-flex align-items-center gap-2" style="width: 160px">
                                        <button @click="giamSoLuongModal" :disabled="soLuongChon <= 1" class="btn btn-outline-secondary rounded-circle p-1" style="width: 32px; height: 32px">
                                            <i class="bi bi-dash"></i>
                                        </button>
                                        <input v-model.number="soLuongChon" type="number" min="1" :max="sanPhamDangXem.soLuong" class="form-control text-center" />
                                        <button @click="tangSoLuongModal" :disabled="soLuongChon >= sanPhamDangXem.soLuong" class="btn btn-outline-secondary rounded-circle p-1" style="width: 32px; height: 32px">
                                            <i class="bi bi-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showProductDetail = false" class="btn btn-secondary">Đóng</button>
                        <button @click="themVaoHoaDonTuModal" :disabled="!sanPhamDangXem || sanPhamDangXem.soLuong <= 0" class="btn btn-primary" :class="{ 'btn-secondary': !sanPhamDangXem || sanPhamDangXem.soLuong <= 0 }">
                            <i class="bi bi-cart-plus me-1"></i>
                            Thêm {{ soLuongChon }} vào hóa đơn
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Payment Modal -->
        <div v-if="showPaymentModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-credit-card me-2"></i>Thanh toán</h5>
                        <button @click="showPaymentModal = false" type="button" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h5 class="mb-3">Thông tin thanh toán</h5>

                                <div class="mb-3">
                                    <label class="form-label">Tổng tiền</label>
                                    <input type="text" :value="formatPrice(tongQuan.tongTienThanhToan)" readonly class="form-control bg-light fw-bold text-danger" />
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Tiền mặt</label>
                                    <input v-model.number="thongTinThanhToan.tienMat" type="number" min="0" class="form-control" />
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Chuyển khoản</label>
                                    <input v-model.number="thongTinThanhToan.chuyenKhoan" type="number" min="0" class="form-control" />
                                </div>

                                <div v-if="khachHang && khachHang.diemTichLuy > 0" class="mb-3">
                                    <label class="form-label">
                                        Sử dụng điểm ({{ khachHang.diemTichLuy }} điểm có sẵn)
                                        <small class="text-muted">- 1 điểm = 1.000₫</small>
                                    </label>
                                    <div class="input-group">
                                        <input
                                            v-model.number="thongTinThanhToan.diemSuDung"
                                            type="number"
                                            min="0"
                                            :max="khachHang.diemTichLuy"
                                            :class="{ 'is-invalid': !validateDiemSuDung() }"
                                            placeholder="Nhập số điểm muốn sử dụng"
                                            class="form-control"
                                        />
                                        <span class="input-group-text">điểm</span>
                                    </div>
                                    <div v-if="!validateDiemSuDung()" class="text-danger small">Số điểm không hợp lệ. Tối đa {{ khachHang.diemTichLuy }} điểm.</div>
                                    <div v-if="thongTinThanhToan.diemSuDung > 0" class="text-success small">Giảm {{ formatPrice(thongTinThanhToan.diemSuDung * 1000) }}</div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Ghi chú</label>
                                    <textarea v-model="thongTinThanhToan.ghiChu" class="form-control" rows="3"></textarea>
                                </div>

                                <!-- Quick amount buttons -->
                                <div class="mb-3">
                                    <label class="form-label">Tiền mặt nhanh:</label>
                                    <div class="row g-2">
                                        <div v-for="amount in quickAmounts" :key="amount" class="col-6">
                                            <button @click="chonTienNhanh(amount)" class="btn btn-outline-primary btn-sm w-100">
                                                {{ formatPrice(amount) }}
                                            </button>
                                        </div>
                                        <div class="col-12">
                                            <button @click="chonTienVuaVua" class="btn btn-primary btn-sm w-100">Vừa vặn</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <h5 class="mb-3">Tóm tắt đơn hàng</h5>

                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Tạm tính:</span>
                                            <span>{{ formatPrice(tongQuan.tongTienGoc) }}</span>
                                        </div>
                                        <div v-if="tongQuan.tongTienKhuyenMai < tongQuan.tongTienGoc" class="d-flex justify-content-between text-success mb-2">
                                            <span>Khuyến mãi:</span>
                                            <span>-{{ formatPrice(tongQuan.tongTienGoc - tongQuan.tongTienKhuyenMai) }}</span>
                                        </div>
                                        <div v-if="voucher" class="d-flex justify-content-between text-success mb-2">
                                            <span>Voucher:</span>
                                            <span>-{{ formatPrice(tongQuan.tongTienVoucher) }}</span>
                                        </div>
                                        <div v-if="thongTinThanhToan.diemSuDung > 0" class="d-flex justify-content-between text-success mb-2">
                                            <span>Điểm tích lũy:</span>
                                            <span>-{{ formatPrice(thongTinThanhToan.diemSuDung * 1000) }}</span>
                                        </div>
                                        <hr />
                                        <div class="d-flex justify-content-between fw-bold h5 mb-3">
                                            <span>Tổng thanh toán:</span>
                                            <span class="text-danger">{{ formatPrice(tinhTongThanhToan()) }}</span>
                                        </div>
                                        <hr />
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Tiền nhận:</span>
                                            <span>{{ formatPrice(thongTinThanhToan.tienMat + thongTinThanhToan.chuyenKhoan) }}</span>
                                        </div>
                                        <div class="d-flex justify-content-between" :class="tinhTienThua() >= 0 ? 'text-success' : 'text-danger'">
                                            <span>{{ tinhTienThua() >= 0 ? 'Tiền thừa:' : 'Còn thiếu:' }}</span>
                                            <span class="fw-bold">{{ formatPrice(Math.abs(tinhTienThua())) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showPaymentModal = false" class="btn btn-secondary">Hủy</button>
                        <button @click="xuLyThanhToan" :disabled="!coTheThanhToan() || loadingPayment" class="btn btn-success" :class="{ 'btn-secondary': !coTheThanhToan() || loadingPayment }">
                            <span v-if="loadingPayment" class="spinner-border spinner-border-sm me-2"></span>
                            {{ loadingPayment ? 'Đang xử lý...' : 'Xác nhận thanh toán' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Invoice Print Modal -->
        <div v-if="showInvoicePrint" class="modal d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-printer me-2"></i>Hóa đơn bán hàng</h5>
                        <button @click="showInvoicePrint = false" type="button" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="invoice-print" class="invoice-print">
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <h2 class="fw-bold">BEE SHOES STORE</h2>
                                    <p class="mb-1">Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</p>
                                    <p class="mb-1">Điện thoại: 0123-456-789</p>
                                    <p class="mb-0">Email: contact@beeshoes.com</p>
                                </div>
                                <div class="col-md-6 text-end">
                                    <h3 class="fw-bold">HÓA ĐƠN BÁN HÀNG</h3>
                                    <p class="mb-1"><strong>Số:</strong> {{ hoaDonDaThanhToan?.maHoaDon || 'HD001' }}</p>
                                    <p class="mb-1"><strong>Ngày:</strong> {{ formatDateTime(new Date()) }}</p>
                                    <p class="mb-0"><strong>Nhân viên:</strong> {{ nhanVienInfo.tenNhanVien }}</p>
                                </div>
                            </div>

                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <h5>Thông tin khách hàng</h5>
                                    <p class="mb-1"><strong>Họ tên:</strong> {{ khachHang?.hoTen || 'Khách lẻ' }}</p>
                                    <p class="mb-1"><strong>Điện thoại:</strong> {{ khachHang?.sdt || 'N/A' }}</p>
                                    <p class="mb-0"><strong>Điểm tích lũy:</strong> {{ khachHang?.diemTichLuy || 0 }} điểm</p>
                                </div>
                            </div>

                            <div class="table-responsive mb-4">
                                <table class="table-bordered table">
                                    <thead class="table-light">
                                        <tr>
                                            <th>STT</th>
                                            <th>Tên sản phẩm</th>
                                            <th>Màu sắc</th>
                                            <th>Kích cỡ</th>
                                            <th class="text-end">Số lượng</th>
                                            <th class="text-end">Đơn giá</th>
                                            <th class="text-end">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, index) in sanPhamDaThanhToan" :key="index">
                                            <td>{{ index + 1 }}</td>
                                            <td>{{ item.tenSanPham }}</td>
                                            <td>{{ item.mauSac?.tenMau || 'N/A' }}</td>
                                            <td>{{ item.kichCo?.tenKichCo || 'N/A' }}</td>
                                            <td class="text-end">{{ item.soLuongDaChon }}</td>
                                            <td class="text-end">{{ formatPrice(item.giaBan) }}</td>
                                            <td class="text-end">{{ formatPrice(item.giaBan * item.soLuongDaChon) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="row">
                                <div class="col-md-6 offset-md-6">
                                    <table class="table">
                                        <tr>
                                            <td>Tạm tính:</td>
                                            <td class="text-end">{{ formatPrice(tongQuanDaThanhToan.tongTienGoc) }}</td>
                                        </tr>
                                        <tr v-if="tongQuanDaThanhToan.tongTienKhuyenMai < tongQuanDaThanhToan.tongTienGoc">
                                            <td>Khuyến mãi:</td>
                                            <td class="text-end">-{{ formatPrice(tongQuanDaThanhToan.tongTienGoc - tongQuanDaThanhToan.tongTienKhuyenMai) }}</td>
                                        </tr>
                                        <tr v-if="voucherDaThanhToan">
                                            <td>Voucher ({{ voucherDaThanhToan.tenVoucher }}):</td>
                                            <td class="text-end">-{{ formatPrice(voucherDaThanhToan.giaTriGiam) }}</td>
                                        </tr>
                                        <tr v-if="thongTinThanhToanCuoi.diemSuDung > 0">
                                            <td>Điểm tích lũy:</td>
                                            <td class="text-end">-{{ formatPrice(thongTinThanhToanCuoi.diemSuDung * 1000) }}</td>
                                        </tr>
                                        <tr class="table-dark">
                                            <td><strong>Tổng thanh toán:</strong></td>
                                            <td class="text-end">
                                                <strong>{{ formatPrice(tongQuanDaThanhToan.tongTienThanhToan) }}</strong>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Tiền mặt:</td>
                                            <td class="text-end">{{ formatPrice(thongTinThanhToanCuoi.tienMat) }}</td>
                                        </tr>
                                        <tr>
                                            <td>Tiền thừa:</td>
                                            <td class="text-end">{{ formatPrice(thongTinThanhToanCuoi.tienThua) }}</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>

                            <div class="my-4 text-center">
                                <p class="fw-bold">Cảm ơn quý khách đã mua hàng!</p>
                                <p>Quý khách vui lòng kiểm tra kỹ hàng hóa trước khi rời khỏi cửa hàng.</p>
                                <p>Hàng đã mua chỉ được đổi trả trong vòng 7 ngày kể từ ngày mua.</p>
                            </div>

                            <div class="row mt-5">
                                <div class="col-6 text-center">
                                    <p class="fw-bold">Người bán</p>
                                    <br /><br /><br />
                                    <p>{{ nhanVienInfo.tenNhanVien }}</p>
                                </div>
                                <div class="col-6 text-center">
                                    <p class="fw-bold">Người mua</p>
                                    <br /><br /><br />
                                    <p>{{ khachHang?.hoTen || '.........................' }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showInvoicePrint = false" class="btn btn-secondary">Đóng</button>
                        <button @click="printInvoice" class="btn btn-primary"><i class="bi bi-printer me-1"></i>In hóa đơn</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { computed, nextTick, onMounted, ref, watch } from 'vue';

export default {
    name: 'BanHangTaiQuay',
    setup() {
        // =================== CONSTANTS ===================
        const API_BASE_URL = 'http://localhost:8080/api/ban-hang';

        // =================== REFS - DATA ===================
        // Employee Info
        const nhanVienInfo = ref({
            tenNhanVien: 'Nguyễn Văn A',
            maNhanVien: 'NV001'
        });

        // Invoice & Products
        const hoaDonCho = ref([]);
        const hoaDonDangChon = ref(null);
        const danhSachSanPham = ref([]);
        const sanPhamDaChon = ref([]);
        const khachHang = ref(null);
        const voucher = ref(null);

        // UI States
        const loading = ref(false);
        const error = ref('');
        const searchKeyword = ref('');
        const qrCode = ref('');
        const customerSearchKeyword = ref('');
        const voucherCode = ref('');
        const soLuongChon = ref(1);

        // Pagination
        const trangHienTai = ref(0);
        const tongSoTrang = ref(0);
        const tongSoPhanTu = ref(0);

        // Modals
        const showCustomerModal = ref(false);
        const showVoucherModal = ref(false);
        const showPaymentModal = ref(false);
        const showProductDetail = ref(false);
        const sanPhamDangXem = ref(null);
        const showQrScanner = ref(false);
        const showCreateCustomerForm = ref(false);
        const showInvoicePrint = ref(false);

        // Loading states
        const loadingCustomers = ref(false);
        const loadingVouchers = ref(false);
        const loadingCreateCustomer = ref(false);
        const loadingVoucherCheck = ref(false);
        const loadingPayment = ref(false);

        // Toasts
        const showToast = ref(false);
        const toastMessage = ref('');
        const toastType = ref('success');

        // Filters
        const filters = ref({
            danhMucId: '',
            thuongHieuId: '',
            minPrice: '',
            maxPrice: ''
        });

        // Master data
        const danhSachDanhMuc = ref([]);
        const danhSachThuongHieu = ref([]);
        const danhSachKhachHang = ref([]);
        const danhSachVoucher = ref([]);

        // Forms
        const newCustomer = ref({
            hoTen: '',
            sdt: '',
            email: '',
            diaChi: ''
        });
        const newCustomerErrors = ref({});

        // Payment
        const thongTinThanhToan = ref({
            tienMat: 0,
            chuyenKhoan: 0,
            ghiChu: '',
            diemSuDung: 0
        });
        const quickAmounts = ref([200000, 500000, 1000000, 2000000, 5000000]);

        // Invoice print data
        const hoaDonDaThanhToan = ref(null);
        const sanPhamDaThanhToan = ref([]);
        const tongQuanDaThanhToan = ref({});
        const voucherDaThanhToan = ref(null);
        const thongTinThanhToanCuoi = ref({});

        // Template refs
        const searchInput = ref(null);
        const qrInput = ref(null);

        // =================== VARIABLES ===================
        let searchTimer = null;
        let priceFilterTimer = null;
        let customerSearchTimer = null;

        // =================== COMPUTED ===================
        const tongQuan = computed(() => {
            if (!sanPhamDaChon.value.length) {
                return {
                    soLuongSanPham: 0,
                    tongSoLuong: 0,
                    tongTienGoc: 0,
                    tongTienKhuyenMai: 0,
                    tongTienVoucher: 0,
                    tongTienThanhToan: 0,
                    tongTietKiem: 0
                };
            }

            const soLuongSanPham = sanPhamDaChon.value.length;
            const tongSoLuong = sanPhamDaChon.value.reduce((sum, item) => {
                const soLuong = Number(item.soLuongDaChon) || 0;
                return sum + soLuong;
            }, 0);

            const tongTienGoc = sanPhamDaChon.value.reduce((sum, item) => {
                const soLuong = Number(item.soLuongDaChon) || 0;
                const gia = Number(item.giaGoc || item.giaBan) || 0;
                return sum + gia * soLuong;
            }, 0);

            const tongTienKhuyenMai = sanPhamDaChon.value.reduce((sum, item) => {
                const soLuong = Number(item.soLuongDaChon) || 0;
                const gia = Number(item.giaBan) || 0;
                return sum + gia * soLuong;
            }, 0);

            const tongTienVoucher = voucher.value ? Number(voucher.value.giaTriGiam) || 0 : 0;
            const tongTienThanhToan = Math.max(0, tongTienKhuyenMai - tongTienVoucher);
            const tongTietKiem = tongTienGoc - tongTienThanhToan;

            return {
                soLuongSanPham,
                tongSoLuong,
                tongTienGoc,
                tongTienKhuyenMai,
                tongTienVoucher,
                tongTienThanhToan,
                tongTietKiem
            };
        });

        // =================== UTILITY FUNCTIONS ===================
        const getAuthToken = () => {
            return localStorage.getItem('auth_token') || localStorage.getItem('token');
        };

        const createAuthHeaders = () => {
            const token = getAuthToken();
            return {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            };
        };

        const showToastMessage = (message, type = 'success') => {
            toastMessage.value = message;
            toastType.value = type;
            showToast.value = true;
            setTimeout(() => (showToast.value = false), 3000);
        };

        const formatPrice = (price) => {
            if (!price && price !== 0) return '0₫';
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(price);
        };

        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('vi-VN');
            } catch {
                return 'N/A';
            }
        };

        const formatDateTime = (date) => {
            return date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const getMauHex = (tenMau) => {
            if (!tenMau) return '#6c757d';

            const colorMap = {
                đỏ: '#dc3545',
                red: '#dc3545',
                xanh: '#0066cc',
                blue: '#0066cc',
                đen: '#000000',
                black: '#000000',
                trắng: '#ffffff',
                white: '#ffffff',
                vàng: '#ffc107',
                yellow: '#ffc107',
                'xanh lá': '#28a745',
                green: '#28a745',
                tím: '#6f42c1',
                purple: '#6f42c1',
                hồng: '#e83e8c',
                pink: '#e83e8c',
                nâu: '#8b4513',
                brown: '#8b4513',
                cam: '#fd7e14',
                orange: '#fd7e14',
                xám: '#6c757d',
                gray: '#6c757d'
            };

            return colorMap[tenMau.toLowerCase()] || '#6c757d';
        };

        const getProductImage = (product) => {
            if (product?.hinhAnhChinh && product.hinhAnhChinh !== 'null') {
                if (product.hinhAnhChinh.startsWith('http')) {
                    return product.hinhAnhChinh;
                }
                return `http://localhost:8080${product.hinhAnhChinh}`;
            }

            if (product?.danhSachHinhAnh && product.danhSachHinhAnh.length > 0) {
                const hinhAnh = product.danhSachHinhAnh[0];
                if (hinhAnh.urlHinhAnh) {
                    return hinhAnh.urlHinhAnh;
                }
                if (hinhAnh.duongDan) {
                    return `http://localhost:8080/hinh-anh/images/${hinhAnh.duongDan.replace(/^\/+/, '')}`;
                }
            }

            return 'https://via.placeholder.com/200x200?text=No+Image';
        };

        const handleImageError = (event) => {
            console.warn('Lỗi load ảnh:', event.target.src);
            event.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
        };

        const getStockBadgeClass = (soLuong) => {
            if (soLuong <= 0) return 'bg-danger';
            if (soLuong <= 5) return 'bg-warning text-dark';
            return 'bg-success';
        };

        // =================== API FUNCTIONS ===================
        const apiCall = async (url, options = {}) => {
            try {
                console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);

                const headers = createAuthHeaders();
                console.log('🔑 Headers:', headers);

                const response = await fetch(url, {
                    ...options,
                    headers: headers
                });

                console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

                if (response.status === 401) {
                    console.warn('🔐 Token hết hạn - chuyển hướng đăng nhập');
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_info');
                    showToastMessage('Phiên đăng nhập hết hạn', 'error');
                    throw new Error('Session expired');
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ HTTP Error ${response.status}:`, errorText);
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('✅ Response Data:', data);
                return data;
            } catch (error) {
                console.error('❌ API Error:', error);

                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    throw new Error('Không thể kết nối đến server. Kiểm tra server có đang chạy không?');
                }

                throw error;
            }
        };

        // =================== BUSINESS FUNCTIONS ===================
        const loadEmployeeInfo = () => {
            try {
                console.log('🔍 Loading employee info...');

                // Lấy thông tin user từ localStorage với key chính xác
                const userInfo = localStorage.getItem('user_info');
                console.log('📝 Raw user_info:', userInfo);

                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    console.log('👤 Parsed user data:', user);

                    // Cập nhật thông tin nhân viên với nhiều fallback options
                    nhanVienInfo.value = {
                        tenNhanVien: user.tenNhanVien || user.hoTen || user.hoVaTen || user.fullName || user.name || user.email?.split('@')[0] || 'Nhân viên',
                        maNhanVien: user.maNhanVien || user.maNV || user.employeeCode || user.staffCode || user.maTaiKhoan || user.id || 'NV001'
                    };

                    console.log('✅ Employee info loaded:', nhanVienInfo.value);
                } else {
                    console.log('⚠️ No user_info found in localStorage');

                    // Fallback: thử lấy từ các key khác
                    const altKeys = ['user', 'currentUser', 'auth_user', 'userDetails'];
                    let found = false;

                    for (const key of altKeys) {
                        const altData = localStorage.getItem(key);
                        if (altData) {
                            try {
                                const altUser = JSON.parse(altData);
                                console.log(`📝 Found data in ${key}:`, altUser);

                                nhanVienInfo.value = {
                                    tenNhanVien: altUser.tenNhanVien || altUser.hoTen || altUser.email?.split('@')[0] || 'Nhân viên',
                                    maNhanVien: altUser.maNhanVien || altUser.id || 'NV001'
                                };

                                found = true;
                                break;
                            } catch (e) {
                                console.log(`❌ Error parsing ${key}:`, e);
                            }
                        }
                    }

                    if (!found) {
                        console.log('⚠️ Using default employee info');
                        // Sử dụng thông tin mặc định
                        nhanVienInfo.value = {
                            tenNhanVien: 'Nhân viên bán hàng',
                            maNhanVien: 'NV001'
                        };
                    }
                }

                console.log('🎯 Final employee info:', nhanVienInfo.value);
            } catch (error) {
                console.error('❌ Error loading employee info:', error);

                // Fallback cuối cùng
                nhanVienInfo.value = {
                    tenNhanVien: 'Nhân viên bán hàng',
                    maNhanVien: 'NV001'
                };
            }
        };

        const loadMasterData = async () => {
            try {
                try {
                    const danhMucData = await apiCall(`${API_BASE_URL}/master-data/danh-muc`);
                    if (danhMucData.success) danhSachDanhMuc.value = danhMucData.data;
                } catch (e) {
                    console.warn('Failed to load danh mục:', e);
                }

                try {
                    const thuongHieuData = await apiCall(`${API_BASE_URL}/master-data/thuong-hieu`);
                    if (thuongHieuData.success) danhSachThuongHieu.value = thuongHieuData.data;
                } catch (e) {
                    console.warn('Failed to load thương hiệu:', e);
                }
            } catch (error) {
                console.error('Lỗi load master data:', error);
            }
        };

        // =================== INVOICE FUNCTIONS ===================
        const taoHoaDonMoi = async () => {
            try {
                const nhanVienId = nhanVienInfo.value.maNhanVien || 1;
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/tao-moi?nhanVienId=${nhanVienId}`, {
                    method: 'POST'
                });

                if (data.success) {
                    await layDanhSachHoaDonCho();
                    showToastMessage('Tạo hóa đơn mới thành công!');
                } else {
                    showToastMessage(data.message || 'Lỗi tạo hóa đơn', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi tạo hóa đơn mới', 'error');
            }
        };

        const layDanhSachHoaDonCho = async () => {
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho`);

                if (data.success) {
                    hoaDonCho.value = data.data;
                    if (data.data.length > 0 && !hoaDonDangChon.value) {
                        chonHoaDon(data.data[0]);
                    }
                }
            } catch (error) {
                console.error('Lỗi lấy danh sách hóa đơn chờ:', error);
                showToastMessage('Lỗi tải danh sách hóa đơn', 'error');
            }
        };

        const chonHoaDon = async (hoaDon) => {
            hoaDonDangChon.value = hoaDon;
            await layTongQuanHoaDon(hoaDon.id);
        };

        const layTongQuanHoaDon = async (hoaDonId) => {
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonId}/tong-quan`);

                if (data.success && data.data) {
                    const tongQuanData = data.data;

                    if (tongQuanData.danhSachSanPham && Array.isArray(tongQuanData.danhSachSanPham)) {
                        const mappedProducts = tongQuanData.danhSachSanPham.map((item, index) => ({
                            id: item.id || `temp_${Date.now()}_${index}`,
                            chiTietSanPhamId: item.chiTietSanPhamId || item.id,
                            tenSanPham: item.tenSanPham || 'Sản phẩm không xác định',
                            soLuongDaChon: Number(item.soLuong) || 1,
                            giaBan: Number(item.giaBan) || Number(item.tongTienSauGiam) / Math.max(1, Number(item.soLuong)) || 0,
                            giaGoc: Number(item.giaGoc) || Number(item.tongTienGoc) / Math.max(1, Number(item.soLuong)) || 0,
                            soLuong: 999,
                            mauSac: {
                                tenMau: item.mauSac || 'N/A',
                                maMau: getMauHex(item.mauSac)
                            },
                            kichCo: {
                                tenKichCo: item.kichCo || 'N/A'
                            },
                            thuongHieu: {
                                tenThuongHieu: item.thuongHieu || 'N/A'
                            },
                            hinhAnhChinh: item.hinhAnhChinh || null
                        }));
                        sanPhamDaChon.value = mappedProducts;
                    } else {
                        sanPhamDaChon.value = [];
                    }

                    khachHang.value = tongQuanData.khachHang || null;
                    voucher.value = tongQuanData.voucher || null;
                } else {
                    sanPhamDaChon.value = [];
                }
            } catch (error) {
                console.error('Lỗi lấy tổng quan hóa đơn:', error);
                sanPhamDaChon.value = [];
                showToastMessage('Lỗi tải thông tin hóa đơn', 'error');
            }
        };

        const xoaHoaDon = async (hoaDonId) => {
            if (!confirm('Bạn có chắc muốn xóa hóa đơn này?')) return;

            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonId}`, {
                    method: 'DELETE'
                });

                if (data.success) {
                    await layDanhSachHoaDonCho();
                    showToastMessage('Xóa hóa đơn thành công!');
                } else {
                    showToastMessage(data.message || 'Lỗi xóa hóa đơn', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi xóa hóa đơn', 'error');
            }
        };

        // =================== PRODUCT FUNCTIONS ===================
        const timKiemSanPham = async (page = 0, forceLoad = false) => {
            console.log(`🔍 Tìm kiếm sản phẩm - trang ${page}...`);
            loading.value = true;
            error.value = '';

            try {
                const params = new URLSearchParams({
                    keyword: searchKeyword.value || '',
                    page: page.toString(),
                    size: '20',
                    sortBy: 'ngayTao',
                    sortDir: 'desc'
                });

                if (filters.value.danhMucId) params.append('danhMucId', filters.value.danhMucId);
                if (filters.value.thuongHieuId) params.append('thuongHieuId', filters.value.thuongHieuId);
                if (filters.value.minPrice) params.append('minPrice', filters.value.minPrice);
                if (filters.value.maxPrice) params.append('maxPrice', filters.value.maxPrice);

                const url = `${API_BASE_URL}/san-pham?${params}`;
                const data = await apiCall(url);

                if (data.success) {
                    danhSachSanPham.value = data.data || [];
                    trangHienTai.value = data.currentPage || 0;
                    tongSoTrang.value = data.totalPages || 0;
                    tongSoPhanTu.value = data.totalElements || 0;

                    if (danhSachSanPham.value.length === 0 && forceLoad) {
                        error.value = 'Hệ thống chưa có sản phẩm nào. Vui lòng thêm sản phẩm trước.';
                    }
                } else {
                    error.value = data.message || 'Có lỗi xảy ra khi tải sản phẩm';
                    danhSachSanPham.value = [];
                }
            } catch (err) {
                error.value = 'Không thể kết nối đến server. Kiểm tra: 1) Server có chạy không? 2) URL API đúng chưa? 3) CORS đã cấu hình?';
                danhSachSanPham.value = [];
                showToastMessage(`Lỗi tải sản phẩm: ${err.message}`, 'error');
            } finally {
                loading.value = false;
            }
        };

        const loadTatCaSanPham = async () => {
            searchKeyword.value = '';
            filters.value = {
                danhMucId: '',
                thuongHieuId: '',
                minPrice: '',
                maxPrice: ''
            };
            await timKiemSanPham(0, true);
        };

        const debounceSearch = () => {
            if (searchTimer) clearTimeout(searchTimer);
            searchTimer = setTimeout(() => timKiemSanPham(0), 500);
        };

        const debouncePriceFilter = () => {
            if (priceFilterTimer) clearTimeout(priceFilterTimer);
            priceFilterTimer = setTimeout(() => timKiemSanPham(0), 800);
        };

        const applyFilters = () => {
            timKiemSanPham(0);
        };

        const resetFilters = () => {
            filters.value = {
                danhMucId: '',
                thuongHieuId: '',
                minPrice: '',
                maxPrice: ''
            };
            searchKeyword.value = '';
            loadTatCaSanPham();
        };

        const chuyenTrang = (page) => {
            if (page >= 0 && page < tongSoTrang.value) {
                timKiemSanPham(page);
            }
        };

        const xemChiTietSanPham = (product) => {
            sanPhamDangXem.value = product;
            soLuongChon.value = 1;
            showProductDetail.value = true;
        };

        const themVaoHoaDon = async (product, soLuong = 1) => {
            if (!hoaDonDangChon.value) {
                showToastMessage('Vui lòng chọn hóa đơn trước', 'error');
                return;
            }

            if (!product || !product.id) {
                showToastMessage('Thông tin sản phẩm không hợp lệ', 'error');
                return;
            }

            if (!Number.isInteger(soLuong) || soLuong <= 0) {
                showToastMessage('Số lượng phải là số nguyên dương', 'error');
                return;
            }

            try {
                const request = {
                    chiTietSanPhamId: Number(product.id),
                    soLuong: Number(soLuong),
                    donGia: Number(product.giaBan) || 0
                };

                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/them-san-pham`, {
                    method: 'POST',
                    body: JSON.stringify(request)
                });

                if (data.success) {
                    showToastMessage(`Đã thêm ${product.tenSanPham} vào hóa đơn!`);
                    setTimeout(() => {
                        layTongQuanHoaDon(hoaDonDangChon.value.id);
                    }, 500);
                } else {
                    showToastMessage(data.message || 'Lỗi thêm sản phẩm', 'error');
                }
            } catch (error) {
                console.error('Lỗi thêm sản phẩm:', error);
                showToastMessage(`Lỗi thêm sản phẩm: ${error.message}`, 'error');
            }
        };

        const themVaoHoaDonTuModal = () => {
            themVaoHoaDon(sanPhamDangXem.value, soLuongChon.value);
            showProductDetail.value = false;
        };

        const tangSoLuong = async (item) => {
            if (!item || !item.id || !hoaDonDangChon.value?.id) {
                showToastMessage('Dữ liệu không hợp lệ', 'error');
                return;
            }

            const soLuongHienTai = Number(item.soLuongDaChon) || 0;
            const soLuongTon = Number(item.soLuong) || 0;

            if (soLuongHienTai >= soLuongTon && soLuongTon > 0) {
                showToastMessage('Không đủ số lượng tồn kho', 'error');
                return;
            }

            try {
                const soLuongMoi = soLuongHienTai + 1;
                const request = {
                    soLuong: soLuongMoi,
                    donGia: Number(item.giaBan) || 0
                };

                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/cap-nhat-san-pham/${item.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(request)
                });

                if (data.success) {
                    const index = sanPhamDaChon.value.findIndex((sp) => sp.id === item.id);
                    if (index > -1) {
                        sanPhamDaChon.value[index].soLuongDaChon = soLuongMoi;
                    }
                    setTimeout(() => {
                        layTongQuanHoaDon(hoaDonDangChon.value.id);
                    }, 300);
                } else {
                    showToastMessage(data.message || 'Lỗi cập nhật số lượng', 'error');
                }
            } catch (error) {
                showToastMessage(`Lỗi cập nhật: ${error.message}`, 'error');
            }
        };

        const giamSoLuong = async (item) => {
            if (!item || !item.id || !hoaDonDangChon.value?.id) {
                showToastMessage('Dữ liệu không hợp lệ', 'error');
                return;
            }

            const soLuongHienTai = Number(item.soLuongDaChon) || 0;

            if (soLuongHienTai <= 1) {
                xoaKhoiGioHang(item);
                return;
            }

            try {
                const soLuongMoi = soLuongHienTai - 1;
                const request = {
                    soLuong: soLuongMoi,
                    donGia: Number(item.giaBan) || 0
                };

                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/cap-nhat-san-pham/${item.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(request)
                });

                if (data.success) {
                    const index = sanPhamDaChon.value.findIndex((sp) => sp.id === item.id);
                    if (index > -1) {
                        sanPhamDaChon.value[index].soLuongDaChon = soLuongMoi;
                    }
                    setTimeout(() => {
                        layTongQuanHoaDon(hoaDonDangChon.value.id);
                    }, 300);
                } else {
                    showToastMessage(data.message || 'Lỗi cập nhật số lượng', 'error');
                }
            } catch (error) {
                showToastMessage(`Lỗi cập nhật: ${error.message}`, 'error');
            }
        };

        const xoaKhoiGioHang = async (item) => {
            if (!item || !item.id || !hoaDonDangChon.value?.id) {
                showToastMessage('Dữ liệu không hợp lệ', 'error');
                return;
            }

            const tenSanPham = item.tenSanPham || 'sản phẩm này';
            if (!confirm(`Bạn có chắc muốn xóa "${tenSanPham}" khỏi hóa đơn?`)) {
                return;
            }

            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/xoa-san-pham/${item.id}`, {
                    method: 'DELETE'
                });

                if (data.success) {
                    const index = sanPhamDaChon.value.findIndex((sp) => sp.id === item.id);
                    if (index > -1) {
                        sanPhamDaChon.value.splice(index, 1);
                    }
                    showToastMessage(`Đã xóa ${tenSanPham} khỏi hóa đơn`);
                    setTimeout(() => {
                        layTongQuanHoaDon(hoaDonDangChon.value.id);
                    }, 300);
                } else {
                    showToastMessage(data.message || 'Lỗi xóa sản phẩm', 'error');
                }
            } catch (error) {
                showToastMessage(`Lỗi xóa sản phẩm: ${error.message}`, 'error');
            }
        };

        const tangSoLuongModal = () => {
            if (soLuongChon.value < sanPhamDangXem.value.soLuong) {
                soLuongChon.value++;
            }
        };

        const giamSoLuongModal = () => {
            if (soLuongChon.value > 1) {
                soLuongChon.value--;
            }
        };

        const quetQR = async () => {
            if (!qrCode.value.trim()) return;

            try {
                const data = await apiCall(`${API_BASE_URL}/san-pham/scan-qr`, {
                    method: 'POST',
                    body: JSON.stringify({ qrCode: qrCode.value })
                });

                if (data.success) {
                    showQrScanner.value = false;
                    qrCode.value = '';
                    await themVaoHoaDon(data.data);
                } else {
                    showToastMessage(data.message || 'Không tìm thấy sản phẩm', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi quét QR code', 'error');
            }
        };

        // =================== CUSTOMER FUNCTIONS ===================
        const loadDanhSachKhachHang = async () => {
            if (loadingCustomers.value) return;

            loadingCustomers.value = true;
            try {
                const params = new URLSearchParams({
                    keyword: customerSearchKeyword.value.trim() || '',
                    page: '0',
                    size: '50'
                });

                const data = await apiCall(`${API_BASE_URL}/khach-hang/search?${params}`);
                if (data.success) {
                    danhSachKhachHang.value = data.data || [];
                } else {
                    danhSachKhachHang.value = [];
                }
            } catch (error) {
                console.error('❌ Lỗi load khách hàng:', error);
                danhSachKhachHang.value = [];
                showToastMessage('Lỗi tải danh sách khách hàng', 'error');
            } finally {
                loadingCustomers.value = false;
            }
        };

        const debounceCustomerSearch = () => {
            if (customerSearchTimer) clearTimeout(customerSearchTimer);
            customerSearchTimer = setTimeout(() => timKiemKhachHang(), 500);
        };

        const timKiemKhachHang = async () => {
            if (!customerSearchKeyword.value.trim()) {
                await loadDanhSachKhachHang();
                return;
            }

            loadingCustomers.value = true;
            try {
                const params = new URLSearchParams({
                    keyword: customerSearchKeyword.value.trim(),
                    page: '0',
                    size: '20'
                });

                const data = await apiCall(`${API_BASE_URL}/khach-hang/search?${params}`);
                if (data.success) {
                    danhSachKhachHang.value = data.data || [];
                } else {
                    danhSachKhachHang.value = [];
                    showToastMessage(data.message || 'Không tìm thấy khách hàng', 'error');
                }
            } catch (error) {
                console.error('❌ Lỗi tìm kiếm khách hàng:', error);
                danhSachKhachHang.value = [];
                showToastMessage('Lỗi tìm kiếm khách hàng', 'error');
            } finally {
                loadingCustomers.value = false;
            }
        };

        const validateNewCustomer = () => {
            const errors = {};

            if (!newCustomer.value.hoTen.trim()) {
                errors.hoTen = 'Vui lòng nhập họ tên';
            } else if (newCustomer.value.hoTen.trim().length < 2) {
                errors.hoTen = 'Họ tên phải có ít nhất 2 ký tự';
            }

            if (!newCustomer.value.sdt.trim()) {
                errors.sdt = 'Vui lòng nhập số điện thoại';
            } else if (!/^[0-9]{10,11}$/.test(newCustomer.value.sdt.trim())) {
                errors.sdt = 'Số điện thoại không hợp lệ (10-11 số)';
            }

            if (newCustomer.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.value.email)) {
                errors.email = 'Email không hợp lệ';
            }

            newCustomerErrors.value = errors;
            return Object.keys(errors).length === 0;
        };

        const taoKhachHangMoi = async () => {
            if (!validateNewCustomer()) {
                showToastMessage('Vui lòng kiểm tra lại thông tin', 'error');
                return;
            }

            loadingCreateCustomer.value = true;
            try {
                const request = {
                    hoTen: newCustomer.value.hoTen.trim(),
                    sdt: newCustomer.value.sdt.trim(),
                    email: newCustomer.value.email.trim() || null,
                    diaChi: newCustomer.value.diaChi.trim() || null
                };

                const data = await apiCall(`${API_BASE_URL}/khach-hang/tao-nhanh`, {
                    method: 'POST',
                    body: JSON.stringify(request)
                });

                if (data.success) {
                    const newCustomerData = data.data;
                    await chonKhachHang(newCustomerData);

                    newCustomer.value = { hoTen: '', sdt: '', email: '', diaChi: '' };
                    newCustomerErrors.value = {};
                    showCreateCustomerForm.value = false;
                    showCustomerModal.value = false;

                    showToastMessage(`Tạo và áp dụng khách hàng ${newCustomerData.hoTen} thành công!`);
                } else {
                    showToastMessage(data.message || 'Lỗi tạo khách hàng', 'error');
                }
            } catch (error) {
                console.error('Lỗi tạo khách hàng:', error);
                showToastMessage('Lỗi tạo khách hàng', 'error');
            } finally {
                loadingCreateCustomer.value = false;
            }
        };

        const chonKhachHang = async (customer) => {
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/ap-dung-khach-hang/${customer.id}`, {
                    method: 'POST'
                });

                if (data.success) {
                    khachHang.value = customer;
                    showCustomerModal.value = false;
                    customerSearchKeyword.value = '';
                    showToastMessage(`Đã áp dụng khách hàng ${customer.hoTen}`);
                } else {
                    showToastMessage(data.message || 'Lỗi áp dụng khách hàng', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi áp dụng khách hàng', 'error');
            }
        };

        const boKhachHang = async () => {
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/bo-khach-hang`, {
                    method: 'DELETE'
                });

                if (data.success) {
                    khachHang.value = null;
                    showToastMessage('Đã bỏ khách hàng');
                } else {
                    showToastMessage(data.message || 'Lỗi bỏ khách hàng', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi bỏ khách hàng', 'error');
            }
        };

        // =================== VOUCHER FUNCTIONS ===================
        const layDanhSachVoucher = async () => {
            if (loadingVouchers.value) return;

            loadingVouchers.value = true;
            try {
                const tongTien = tongQuan.value.tongTienKhuyenMai;
                const khachHangId = khachHang.value?.id;

                const params = new URLSearchParams();
                if (khachHangId) params.append('khachHangId', khachHangId);
                if (tongTien) params.append('tongTien', tongTien);

                const data = await apiCall(`${API_BASE_URL}/voucher/kha-dung?${params}`);
                if (data.success) {
                    danhSachVoucher.value = data.data || [];
                } else {
                    danhSachVoucher.value = [];
                }
            } catch (error) {
                console.error('❌ Lỗi load voucher:', error);
                danhSachVoucher.value = [];
                showToastMessage('Lỗi tải danh sách voucher', 'error');
            } finally {
                loadingVouchers.value = false;
            }
        };

        const kiemTraVoucher = async () => {
            if (!voucherCode.value.trim()) {
                showToastMessage('Vui lòng nhập mã voucher', 'error');
                return;
            }

            loadingVoucherCheck.value = true;
            try {
                const request = {
                    maVoucher: voucherCode.value.trim(),
                    tongTien: tongQuan.value.tongTienKhuyenMai,
                    khachHangId: khachHang.value?.id
                };

                const data = await apiCall(`${API_BASE_URL}/voucher/kiem-tra`, {
                    method: 'POST',
                    body: JSON.stringify(request)
                });

                if (data.valid && data.voucher) {
                    await chonVoucher(data.voucher);
                    voucherCode.value = '';
                } else {
                    showToastMessage(data.message || 'Mã voucher không hợp lệ', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi kiểm tra voucher', 'error');
            } finally {
                loadingVoucherCheck.value = false;
            }
        };

        const chonVoucher = async (selectedVoucher) => {
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/ap-dung-voucher/${selectedVoucher.id}`, {
                    method: 'POST'
                });

                if (data.success) {
                    voucher.value = selectedVoucher;
                    showVoucherModal.value = false;
                    voucherCode.value = '';
                    showToastMessage(`Đã áp dụng voucher ${selectedVoucher.tenVoucher}`);
                } else {
                    showToastMessage(data.message || 'Lỗi áp dụng voucher', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi áp dụng voucher', 'error');
            }
        };

        const boVoucher = async () => {
            try {
                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/bo-voucher`, {
                    method: 'DELETE'
                });

                if (data.success) {
                    voucher.value = null;
                    showToastMessage('Đã bỏ voucher');
                } else {
                    showToastMessage(data.message || 'Lỗi bỏ voucher', 'error');
                }
            } catch (error) {
                showToastMessage('Lỗi bỏ voucher', 'error');
            }
        };

        // =================== PAYMENT FUNCTIONS ===================
        const validateDiemSuDung = () => {
            if (!khachHang.value) return true;
            const maxDiem = khachHang.value.diemTichLuy || 0;
            const diemSuDung = thongTinThanhToan.value.diemSuDung || 0;
            return diemSuDung >= 0 && diemSuDung <= maxDiem;
        };

        const tinhTongThanhToan = () => {
            let tong = tongQuan.value.tongTienThanhToan;
            if (thongTinThanhToan.value.diemSuDung > 0) {
                tong -= thongTinThanhToan.value.diemSuDung * 1000;
            }
            return Math.max(0, tong);
        };

        const tinhTienThua = () => {
            const tongNhan = thongTinThanhToan.value.tienMat + thongTinThanhToan.value.chuyenKhoan;
            return tongNhan - tinhTongThanhToan();
        };

        const coTheThanhToan = () => {
            return tinhTienThua() >= 0 && sanPhamDaChon.value.length > 0;
        };

        const chonTienNhanh = (amount) => {
            thongTinThanhToan.value.tienMat = amount;
            thongTinThanhToan.value.chuyenKhoan = 0;
        };

        const chonTienVuaVua = () => {
            thongTinThanhToan.value.tienMat = tinhTongThanhToan();
            thongTinThanhToan.value.chuyenKhoan = 0;
        };

        const xuLyThanhToan = async () => {
            if (loadingPayment.value) return;

            try {
                if (!hoaDonDangChon.value?.id) {
                    showToastMessage('Chưa chọn hóa đơn để thanh toán', 'error');
                    return;
                }

                if (!sanPhamDaChon.value || sanPhamDaChon.value.length === 0) {
                    showToastMessage('Hóa đơn chưa có sản phẩm nào', 'error');
                    return;
                }

                if (!coTheThanhToan()) {
                    showToastMessage('Thông tin thanh toán chưa đủ', 'error');
                    return;
                }

                loadingPayment.value = true;

                const requestData = {
                    loaiHoaDon: 'OFFLINE',
                    ghiChu: String(thongTinThanhToan.value.ghiChu || '').trim()
                };

                if (khachHang.value?.id) {
                    requestData.khachHangId = Number(khachHang.value.id);
                }

                if (voucher.value?.id) {
                    requestData.voucherId = Number(voucher.value.id);
                }

                const diemSuDung = Number(thongTinThanhToan.value.diemSuDung) || 0;
                if (diemSuDung > 0) {
                    const maxDiem = khachHang.value?.diemTichLuy || 0;
                    if (diemSuDung > maxDiem) {
                        showToastMessage(`Chỉ có thể sử dụng tối đa ${maxDiem} điểm`, 'error');
                        return;
                    }
                    requestData.diemSuDung = diemSuDung;
                }

                const data = await apiCall(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/thanh-toan`, {
                    method: 'POST',
                    body: JSON.stringify(requestData)
                });

                if (data.success) {
                    hoaDonDaThanhToan.value = data.data;
                    sanPhamDaThanhToan.value = [...sanPhamDaChon.value];
                    tongQuanDaThanhToan.value = { ...tongQuan.value };
                    voucherDaThanhToan.value = voucher.value ? { ...voucher.value } : null;
                    thongTinThanhToanCuoi.value = {
                        ...thongTinThanhToan.value,
                        tienThua: tinhTienThua()
                    };

                    showPaymentModal.value = false;

                    thongTinThanhToan.value = {
                        tienMat: 0,
                        chuyenKhoan: 0,
                        ghiChu: '',
                        diemSuDung: 0
                    };
                    khachHang.value = null;
                    voucher.value = null;

                    await layDanhSachHoaDonCho();
                    showToastMessage('💰 Thanh toán thành công!');
                    showInvoicePrint.value = true;
                } else {
                    showToastMessage(data.message || 'Thanh toán thất bại', 'error');
                }
            } catch (error) {
                console.error('Lỗi xử lý thanh toán:', error);
                let errorMessage = 'Lỗi xử lý thanh toán';
                if (error.message.includes('HTTP 400')) {
                    errorMessage = 'Dữ liệu thanh toán không hợp lệ. Vui lòng kiểm tra lại.';
                } else if (error.message.includes('HTTP 404')) {
                    errorMessage = 'Không tìm thấy hóa đơn. Vui lòng tải lại trang.';
                } else if (error.message.includes('HTTP 500')) {
                    errorMessage = 'Lỗi hệ thống. Vui lòng thử lại sau.';
                } else if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Mất kết nối mạng. Vui lòng kiểm tra kết nối.';
                } else {
                    errorMessage = `Lỗi: ${error.message}`;
                }
                showToastMessage(errorMessage, 'error');
            } finally {
                loadingPayment.value = false;
            }
        };

        const printInvoice = () => {
            const printContent = document.getElementById('invoice-print');
            const originalContent = document.body.innerHTML;

            document.body.innerHTML = printContent.outerHTML;
            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload();
        };

        // =================== LIFECYCLE HOOKS ===================
        onMounted(async () => {
            console.log('🚀 Khởi tạo ứng dụng POS...');

            try {
                loadEmployeeInfo();
                await loadMasterData();
                await layDanhSachHoaDonCho();

                if (hoaDonCho.value.length === 0) {
                    await taoHoaDonMoi();
                }

                await loadTatCaSanPham();

                if (danhSachSanPham.value.length > 0) {
                    showToastMessage(`✅ Đã load ${danhSachSanPham.value.length} sản phẩm`);
                }
            } catch (error) {
                console.error('❌ Lỗi khởi tạo:', error);
                showToastMessage('Lỗi khởi tạo ứng dụng: ' + error.message, 'error');
            }
        });

        // =================== WATCHERS ===================
        watch(showCustomerModal, async (newVal) => {
            if (newVal) {
                customerSearchKeyword.value = '';
                await loadDanhSachKhachHang();
            } else {
                danhSachKhachHang.value = [];
                customerSearchKeyword.value = '';
            }
        });

        watch(showVoucherModal, async (newVal) => {
            if (newVal) {
                voucherCode.value = '';
                await layDanhSachVoucher();
            } else {
                danhSachVoucher.value = [];
                voucherCode.value = '';
            }
        });

        watch(showQrScanner, (newVal) => {
            if (newVal) {
                nextTick(() => {
                    qrInput.value?.focus();
                });
            }
        });

        watch(showCreateCustomerForm, (newVal) => {
            if (newVal) {
                newCustomer.value = { hoTen: '', sdt: '', email: '', diaChi: '' };
                newCustomerErrors.value = {};
            }
        });

        // =================== RETURN ===================
        return {
            // Reactive Data
            nhanVienInfo,
            hoaDonCho,
            hoaDonDangChon,
            danhSachSanPham,
            sanPhamDaChon,
            khachHang,
            voucher,
            loading,
            error,
            searchKeyword,
            qrCode,
            customerSearchKeyword,
            voucherCode,
            soLuongChon,
            trangHienTai,
            tongSoTrang,
            tongSoPhanTu,
            filters,
            danhSachDanhMuc,
            danhSachThuongHieu,
            danhSachKhachHang,
            danhSachVoucher,
            thongTinThanhToan,
            quickAmounts,
            newCustomer,
            newCustomerErrors,
            hoaDonDaThanhToan,
            sanPhamDaThanhToan,
            tongQuanDaThanhToan,
            voucherDaThanhToan,
            thongTinThanhToanCuoi,

            // Loading States
            loadingCustomers,
            loadingVouchers,
            loadingCreateCustomer,
            loadingVoucherCheck,
            loadingPayment,

            // Modal States
            showCustomerModal,
            showVoucherModal,
            showPaymentModal,
            showProductDetail,
            sanPhamDangXem,
            showQrScanner,
            showCreateCustomerForm,
            showInvoicePrint,

            // Toast States
            showToast,
            toastMessage,
            toastType,

            // Template Refs
            searchInput,
            qrInput,

            // Computed
            tongQuan,

            // Invoice Functions
            taoHoaDonMoi,
            layDanhSachHoaDonCho,
            chonHoaDon,
            xoaHoaDon,

            // Product Functions
            timKiemSanPham,
            loadTatCaSanPham,
            debounceSearch,
            debouncePriceFilter,
            applyFilters,
            resetFilters,
            chuyenTrang,
            xemChiTietSanPham,
            themVaoHoaDon,
            themVaoHoaDonTuModal,
            tangSoLuong,
            giamSoLuong,
            xoaKhoiGioHang,
            tangSoLuongModal,
            giamSoLuongModal,
            quetQR,

            // Customer Functions
            loadDanhSachKhachHang,
            debounceCustomerSearch,
            timKiemKhachHang,
            validateNewCustomer,
            taoKhachHangMoi,
            chonKhachHang,
            boKhachHang,

            // Voucher Functions
            layDanhSachVoucher,
            kiemTraVoucher,
            chonVoucher,
            boVoucher,

            // Payment Functions
            validateDiemSuDung,
            tinhTongThanhToan,
            tinhTienThua,
            coTheThanhToan,
            chonTienNhanh,
            chonTienVuaVua,
            xuLyThanhToan,
            printInvoice,

            // Utility Functions
            formatPrice,
            formatDate,
            formatDateTime,
            getMauHex,
            getProductImage,
            handleImageError,
            getStockBadgeClass
        };
    }
};
</script>
<style scoped>
/* Container & Layout */
.pos-container {
    height: 100vh;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f8fafc;
}

.pos-layout {
    height: 100vh;
}

.left-panel {
    height: 100vh;
    overflow-y: auto;
}

.right-panel {
    height: 100vh;
    overflow-y: auto;
}

/* Product Cards */
.product-card {
    transition: all 0.3s ease;
    height: 100%;
    cursor: pointer;
}

.product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

.product-image {
    height: 180px;
    overflow: hidden;
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
    transform: scale(1.05);
}

/* Color Dots */
.color-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    display: inline-block;
}

/* Cart Items */
.cart-item {
    transition: all 0.2s ease;
}

.cart-item:hover {
    background-color: rgba(13, 110, 253, 0.05) !important;
}

.item-image {
    width: 50px;
    height: 50px;
    overflow: hidden;
    border-radius: 0.375rem;
}

.item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Quantity Buttons */
.qty-btn {
    width: 30px;
    height: 30px;
    border-radius: 50% !important;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    padding: 0 !important;
}

/* Toast Container */
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1100;
}

/* Product Grid */
.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
}

/* Spinner */
.spinner-border-sm {
    width: 1rem;
    height: 1rem;
}

/* Invoice Print Styles */
.invoice-print {
    background: white;
    color: black;
    font-family: 'Times New Roman', serif;
}

.invoice-print h1,
.invoice-print h2,
.invoice-print h3,
.invoice-print h4 {
    color: black !important;
}

.invoice-print .table {
    color: black !important;
}

.invoice-print .table th {
    background-color: #f8f9fa !important;
    color: black !important;
}

.invoice-print .table td {
    color: black !important;
}

/* Print Media */
@media print {
    .modal-header,
    .modal-footer,
    .btn,
    .no-print {
        display: none !important;
    }

    .modal-body {
        padding: 0 !important;
    }

    .invoice-print {
        margin: 0;
        padding: 20px;
        box-shadow: none !important;
    }

    .modal-content {
        border: none !important;
        box-shadow: none !important;
    }

    .modal-dialog {
        margin: 0 !important;
        max-width: 100% !important;
    }
}

/* Responsive Design */
@media (max-width: 992px) {
    .pos-layout {
        flex-direction: column !important;
    }

    .left-panel,
    .right-panel {
        height: auto;
        min-height: 50vh;
    }

    .left-panel {
        order: 2;
    }

    .right-panel {
        order: 1;
    }
}

@media (max-width: 768px) {
    .product-grid {
        grid-template-columns: 1fr;
    }

    .modal-dialog {
        margin: 0.5rem;
    }

    .modal-xl,
    .modal-lg {
        max-width: calc(100vw - 1rem);
    }
}

@media (max-width: 576px) {
    .pos-container {
        font-size: 14px;
    }

    .card-body {
        padding: 0.75rem !important;
    }

    .btn-sm {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
    }

    .h6,
    .card-title {
        font-size: 0.9rem;
    }
}

/* Custom Badge Colors */
.badge.bg-light {
    color: #495057 !important;
    background-color: #f8f9fa !important;
}

/* Custom Button Hover Effects */
.btn-outline-primary:hover {
    background-color: #0d6efd !important;
    border-color: #0d6efd !important;
}

.btn-outline-success:hover {
    background-color: #198754 !important;
    border-color: #198754 !important;
}

.btn-outline-danger:hover {
    background-color: #dc3545 !important;
    border-color: #dc3545 !important;
}

.btn-outline-secondary:hover {
    background-color: #6c757d !important;
    border-color: #6c757d !important;
}

/* Custom Modal Backdrop */
.modal {
    backdrop-filter: blur(4px);
}

/* Custom Scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
}

/* Animation Classes */
.fade-in {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.slide-in {
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Loading States */
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
}

/* Focus States */
.form-control:focus,
.form-select:focus {
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

/* Disabled States */
.btn:disabled,
.btn.disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

/* Error States */
.is-invalid {
    border-color: #dc3545;
}

.invalid-feedback {
    display: block;
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.875em;
    color: #dc3545;
}

/* Success States */
.is-valid {
    border-color: #198754;
}

.valid-feedback {
    display: block;
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.875em;
    color: #198754;
}

/* Custom Table Styles */
.table-responsive {
    border-radius: 0.375rem;
    overflow: hidden;
}

.table th {
    border-top: none;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
}

/* Custom Card Styles */
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    transition: box-shadow 0.15s ease-in-out;
}

.card:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.card-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
    font-weight: 600;
}

/* Custom List Group */
.list-group-item {
    border: 1px solid #dee2e6;
    transition: all 0.15s ease-in-out;
}

.list-group-item:hover {
    background-color: #f8f9fa;
    transform: translateY(-1px);
}

.list-group-item-action {
    cursor: pointer;
}

/* Custom Alert Styles */
.alert {
    border: none;
    border-radius: 0.5rem;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.alert-danger {
    background: linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%);
    color: #721c24;
}

.alert-success {
    background: linear-gradient(135deg, #d1e7dd 0%, #badbcc 100%);
    color: #0f5132;
}

.alert-warning {
    background: linear-gradient(135deg, #fff3cd 0%, #ffecb5 100%);
    color: #664d03;
}

/* Custom Progress Bar */
.progress {
    height: 0.5rem;
    border-radius: 0.25rem;
    background-color: #e9ecef;
}

.progress-bar {
    background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
    transition: width 0.6s ease;
}

/* Utility Classes */
.text-truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.text-truncate-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.cursor-pointer {
    cursor: pointer;
}

.cursor-not-allowed {
    cursor: not-allowed;
}

.user-select-none {
    user-select: none;
}

/* Dark Mode Support (Optional) */
@media (prefers-color-scheme: dark) {
    .pos-container {
        background: #1a1a1a;
        color: #ffffff;
    }

    .card {
        background-color: #2d2d2d;
        border-color: #404040;
    }

    .modal-content {
        background-color: #2d2d2d;
        color: #ffffff;
    }

    .form-control,
    .form-select {
        background-color: #404040;
        border-color: #555555;
        color: #ffffff;
    }

    .table {
        color: #ffffff;
    }

    .table th {
        border-color: #555555;
    }

    .table td {
        border-color: #555555;
    }
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
    .card {
        border: 2px solid #000000;
    }

    .btn {
        border-width: 2px;
    }

    .form-control,
    .form-select {
        border-width: 2px;
    }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
</style>
