    const xuLyThanhToan = async () => { console.log('💳 Bắt đầu xử lý thanh toán...'); // Validation cơ bản if (!hoaDonDangChon.value?.id) { showToast('Chưa chọn hóa đơn để thanh toán', false); return; } if (!sanPhamDaChon.value ||
    sanPhamDaChon.value.length === 0) { showToast('Hóa đơn chưa có sản phẩm nào', false); return; } const tongTienCanThanhToan = tinhTongThanhToan(); console.log('💰 Tổng tiền cần thanh toán:', tongTienCanThanhToan); if (tongTienCanThanhToan <= 0) {
    showToast('Tổng tiền thanh toán không hợp lệ', false); return; } if (!coTheThanhToan()) { showToast('Thông tin thanh toán chưa đủ', false); return; } try { // Chuẩn bị dữ liệu request const requestData = { loaiHoaDon: 'OFFLINE', ghiChu:
    String(thongTinThanhToan.value.ghiChu || '').trim() }; // CHỈ THÊM khachHangId khi có khách hàng thực sự if (khachHang.value && khachHang.value.id) { requestData.khachHangId = Number(khachHang.value.id); console.log('👤 Khách hàng ID:',
    requestData.khachHangId); // Chỉ cho phép sử dụng điểm khi có khách hàng const diemSuDung = Number(thongTinThanhToan.value.diemSuDung) || 0; if (diemSuDung > 0) { const maxDiem = khachHang.value.diemTichLuy || 0; if (diemSuDung > maxDiem) {
    showToast(`Chỉ có thể sử dụng tối đa ${maxDiem} điểm`, false); return; } requestData.diemSuDung = diemSuDung; console.log('⭐ Điểm sử dụng:', requestData.diemSuDung); } } else { console.log('👤 Khách lẻ - không gửi khachHangId'); } // Thêm voucher
    nếu có if (voucher.value && voucher.value.id) { requestData.voucherId = Number(voucher.value.id); console.log('🎫 Voucher ID:', requestData.voucherId); } console.log('📤 Final request thanh toán:', requestData); const response = await
    fetch(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/thanh-toan`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(requestData) }); console.log('📡 Response status:',
    response.status); if (!response.ok) { const errorText = await response.text(); console.error('❌ HTTP Error:', response.status, errorText); // Xử lý lỗi validation cụ thể if (response.status === 400 && errorText.includes('khachHangId')) { throw new
    Error('Backend yêu cầu khách hàng để thanh toán. Vui lòng chọn khách hàng hoặc tạo khách hàng mới.'); } else if (response.status === 400) { throw new Error('Dữ liệu thanh toán không hợp lệ. Vui lòng kiểm tra lại thông tin.'); } else { throw new
    Error(`HTTP ${response.status}: ${errorText || response.statusText}`); } } const data = await response.json(); console.log('📥 Response thanh toán:', data); if (data.success) { // Thanh toán thành công showPaymentModal.value = false;
    resetThanhToan(); // Reload danh sách hóa đơn chờ await layDanhSachHoaDonCho(); showToast('💰 Thanh toán thành công!'); // Log thông tin hóa đơn đã thanh toán console.log('✅ Hóa đơn đã thanh toán:', data.data); } else { const errorMsg = data.message
    || 'Thanh toán thất bại'; console.error('❌ Thanh toán thất bại:', errorMsg); showToast(errorMsg, false); } } catch (error) { console.error('💥 Lỗi xử lý thanh toán:', error); let errorMessage = 'Lỗi xử lý thanh toán'; if
    (error.message.includes('khachHangId')) { errorMessage = error.message; } else if (error.message.includes('HTTP 400')) { errorMessage = 'Dữ liệu thanh toán không hợp lệ. Vui lòng kiểm tra lại.'; } else if (error.message.includes('HTTP 404')) {
    errorMessage = 'Không tìm thấy hóa đơn. Vui lòng tải lại trang.'; } else if (error.message.includes('HTTP 500')) { errorMessage = 'Lỗi hệ thống. Vui lòng thử lại sau.'; } else if (error.message.includes('Failed to fetch')) { errorMessage = 'Mất kết
    nối mạng. Vui lòng kiểm tra kết nối.'; } else { errorMessage = `Lỗi: ${error.message}`; } showToast(errorMessage, false); } };
    <template>
        <div class="container-fluid pos-container p-0">
            <div class="row g-0 h-100">
                <!-- Left Panel - Sản phẩm -->
                <div class="col-8 left-panel">
                    <!-- Header -->
                    <div class="border-bottom bg-white p-3">
                        <div class="row align-items-center">
                            <div class="col-md-4">
                                <h4 class="mb-0 text-primary"><span style="margin-right: 8px">🏪</span> Bán Hàng Tại Quầy</h4>
                            </div>
                            <div class="col-md-6">
                                <div class="input-group">
                                    <input v-model="searchKeyword" @input="debounceSearch" type="text" class="form-control" placeholder="Tìm sản phẩm hoặc quét mã QR..." ref="searchInput" />
                                    <button @click="showQrScanner = true" class="btn btn-outline-secondary">
                                        <span>📱</span>
                                    </button>
                                    <button @click="timKiemSanPham" class="btn btn-primary">
                                        <span>🔍</span>
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-2 text-end">
                                <div class="bg-light rounded p-2">
                                    <small class="text-muted d-block">Tìm thấy</small>
                                    <strong class="text-primary">{{ tongSoPhanTu }} sản phẩm</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Filters -->
                    <div class="bg-light border-bottom p-3">
                        <div class="row g-2 align-items-end">
                            <div class="col-md-2">
                                <label class="form-label small">Danh mục</label>
                                <select v-model="filters.danhMucId" @change="applyFilters" class="form-select form-select-sm">
                                    <option value="">Tất cả danh mục</option>
                                    <option v-for="dm in danhSachDanhMuc" :key="dm.id" :value="dm.id">
                                        {{ dm.tenDanhMuc }}
                                    </option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small">Thương hiệu</label>
                                <select v-model="filters.thuongHieuId" @change="applyFilters" class="form-select form-select-sm">
                                    <option value="">Tất cả thương hiệu</option>
                                    <option v-for="th in danhSachThuongHieu" :key="th.id" :value="th.id">
                                        {{ th.tenThuongHieu }}
                                    </option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small">Khoảng giá</label>
                                <div class="input-group input-group-sm">
                                    <input v-model="filters.minPrice" @input="debouncePriceFilter" type="number" class="form-control" placeholder="Từ" />
                                    <span class="input-group-text">-</span>
                                    <input v-model="filters.maxPrice" @input="debouncePriceFilter" type="number" class="form-control" placeholder="Đến" />
                                </div>
                            </div>
                            <div class="col-md-2">
                                <button @click="resetFilters" class="btn btn-outline-secondary btn-sm w-100"><i class="bi bi-arrow-clockwise"></i> Reset</button>
                            </div>
                            <div class="col-md-3">
                                <div class="d-flex justify-content-end">
                                    <div class="rounded border bg-white px-3 py-2">
                                        <div class="row g-2 text-center">
                                            <div class="col-4">
                                                <small class="text-muted d-block">Trang</small>
                                                <strong class="text-primary">{{ trangHienTai + 1 }}/{{ tongSoTrang }}</strong>
                                            </div>
                                            <div class="col-4">
                                                <small class="text-muted d-block">Hiện tại</small>
                                                <strong class="text-success">{{ danhSachSanPham.length }}</strong>
                                            </div>
                                            <div class="col-4">
                                                <small class="text-muted d-block">Tổng</small>
                                                <strong class="text-info">{{ tongSoPhanTu }}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Products Grid -->
                    <div class="p-3">
                        <!-- Loading -->
                        <div v-if="loading" class="py-5 text-center">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Đang tải...</span>
                            </div>
                            <p class="text-muted mt-2">Đang tải sản phẩm...</p>
                        </div>

                        <!-- Error -->
                        <div v-if="error" class="alert alert-danger" role="alert">
                            <i class="bi bi-exclamation-triangle"></i> {{ error }}
                            <button @click="taiLaiSanPham" class="btn btn-outline-danger btn-sm ms-2">Thử lại</button>
                        </div>

                        <!-- Products -->
                        <div v-if="!loading && !error" class="row g-3">
                            <div v-for="product in danhSachSanPham" :key="product.id" class="col-xl-3 col-lg-4 col-md-6">
                                <div class="card h-100 product-card" @click="xemChiTietSanPham(product)">
                                    <div class="position-relative">
                                        <img :src="getProductImage(product)" :alt="product.tenSanPham" class="card-img-top product-img" style="height: 150px; object-fit: cover" @error="handleImageError" />
                                        <div class="position-absolute end-0 top-0 p-2">
                                            <span v-if="product.soLuong <= 0" class="badge bg-danger"> Hết hàng </span>
                                            <span v-else-if="product.soLuong <= 5" class="badge bg-warning text-dark"> Còn {{ product.soLuong }} </span>
                                        </div>
                                        <div class="position-absolute start-0 top-0 p-2">
                                            <span v-if="product.giaGoc && product.giaGoc > product.giaBan" class="badge bg-success"> -{{ Math.round((1 - product.giaBan / product.giaGoc) * 100) }}% </span>
                                        </div>
                                    </div>

                                    <div class="card-body p-3">
                                        <h6 class="card-title text-truncate mb-2" :title="product.tenSanPham">
                                            {{ product.tenSanPham }}
                                        </h6>

                                        <div class="mb-2">
                                            <div class="d-flex align-items-center mb-1">
                                                <span class="color-dot me-2" :style="{ backgroundColor: product.mauSac?.maMau || '#6c757d' }"> </span>
                                                <small class="text-muted">{{ product.mauSac?.tenMau || 'N/A' }}</small>
                                                <span class="badge bg-light text-dark ms-auto">
                                                    {{ product.kichCo?.tenKichCo || 'N/A' }}
                                                </span>
                                            </div>
                                        </div>

                                        <div class="mb-2">
                                            <span class="fw-bold text-danger">{{ formatPrice(product.giaBan) }}</span>
                                            <span v-if="product.giaGoc && product.giaGoc > product.giaBan" class="text-decoration-line-through text-muted small ms-2">
                                                {{ formatPrice(product.giaGoc) }}
                                            </span>
                                        </div>

                                        <button @click.stop="themVaoHoaDon(product)" class="btn btn-primary btn-sm w-100" :disabled="product.soLuong <= 0">
                                            <i class="bi bi-cart-plus"></i>
                                            {{ product.soLuong <= 0 ? 'Hết hàng' : 'Thêm vào hóa đơn' }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Empty State -->
                        <div v-if="!loading && !error && danhSachSanPham.length === 0" class="py-5 text-center">
                            <i class="bi bi-search display-1 text-muted"></i>
                            <h5 class="text-muted mt-3">Không tìm thấy sản phẩm</h5>
                            <p class="text-muted">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                        </div>

                        <!-- Pagination -->
                        <nav v-if="tongSoTrang > 1" class="mt-4">
                            <ul class="pagination justify-content-center">
                                <li class="page-item" :class="{ disabled: trangHienTai === 0 }">
                                    <button @click="chuyenTrang(trangHienTai - 1)" class="page-link">
                                        <i class="bi bi-chevron-left"></i>
                                    </button>
                                </li>
                                <li class="page-item active">
                                    <span class="page-link">{{ trangHienTai + 1 }} / {{ tongSoTrang }}</span>
                                </li>
                                <li class="page-item" :class="{ disabled: trangHienTai >= tongSoTrang - 1 }">
                                    <button @click="chuyenTrang(trangHienTai + 1)" class="page-link">
                                        <i class="bi bi-chevron-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>

                <!-- Right Panel - Hóa đơn -->
                <div class="col-4 right-panel">
                    <!-- Invoice Tabs -->
                    <div class="invoice-tabs border-bottom bg-white">
                        <div class="d-flex align-items-center justify-content-between p-2">
                            <div class="d-flex flex-nowrap overflow-auto">
                                <div v-for="(hoaDon, index) in hoaDonCho" :key="hoaDon.id" class="invoice-tab me-2 flex-shrink-0" :class="{ active: hoaDonDangChon?.id === hoaDon.id }" @click="chonHoaDon(hoaDon)">
                                    <div class="d-flex align-items-center">
                                        <span class="me-1" style="font-size: 12px">📄</span>
                                        <span class="small">HĐ{{ index + 1 }}</span>
                                        <button v-if="hoaDonCho.length > 1" @click.stop="xoaHoaDon(hoaDon.id)" class="btn btn-sm invoice-close-btn ms-2 p-0" style="width: 16px; height: 16px; border: none; background: none" title="Đóng hóa đơn">
                                            <span class="text-danger" style="font-size: 12px; line-height: 1">✕</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button @click="taoHoaDonMoi" class="btn btn-success btn-sm flex-shrink-0"><span style="font-size: 14px; margin-right: 4px">+</span> Tạo HĐ</button>
                        </div>
                    </div>

                    <!-- Invoice Content -->
                    <div v-if="hoaDonDangChon" class="invoice-content p-3">
                        <!-- Customer Section -->
                        <div class="card mb-3">
                            <div class="card-header py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0"><span style="margin-right: 6px">👤</span> Khách hàng</h6>
                                    <button @click="showCustomerModal = true" class="btn btn-outline-primary btn-sm"><span style="margin-right: 4px">🔍</span> Chọn</button>
                                </div>
                            </div>
                            <div class="card-body py-2">
                                <div v-if="khachHang">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>{{ khachHang.hoTen }}</strong
                                            ><br />
                                            <small class="text-muted">{{ khachHang.sdt }}</small
                                            ><br />
                                            <small class="text-info">Điểm tích lũy: {{ khachHang.diemTichLuy || 0 }}</small>
                                        </div>
                                        <button @click="boKhachHang" class="btn btn-outline-danger btn-sm">
                                            <span style="font-size: 12px">✕</span>
                                        </button>
                                    </div>
                                </div>
                                <div v-else class="text-muted py-2 text-center"><span style="margin-right: 6px">👤</span> Khách lẻ</div>
                            </div>
                        </div>

                        <!-- Voucher Section -->
                        <div class="card mb-3">
                            <div class="card-header py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0"><span style="margin-right: 6px">🎫</span> Voucher</h6>
                                    <button @click="showVoucherModal = true" class="btn btn-outline-success btn-sm"><span style="margin-right: 4px">🔍</span> Áp dụng</button>
                                </div>
                            </div>
                            <div class="card-body py-2">
                                <div v-if="voucher">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>{{ voucher.tenVoucher }}</strong
                                            ><br />
                                            <small class="text-success">Giảm {{ formatPrice(voucher.giaTriGiam) }}</small>
                                        </div>
                                        <button @click="boVoucher" class="btn btn-outline-danger btn-sm">
                                            <span style="font-size: 12px">✕</span>
                                        </button>
                                    </div>
                                </div>
                                <div v-else class="text-muted py-2 text-center"><span style="margin-right: 6px">🎫</span> Chưa có voucher</div>
                            </div>
                        </div>

                        <!-- Cart Items -->
                        <div class="card mb-3">
                            <div class="card-header py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">
                                        <span style="margin-right: 6px">🛒</span>
                                        Sản phẩm
                                    </h6>
                                    <span class="badge bg-primary"> {{ tongQuan.soLuongSanPham }} loại - {{ tongQuan.tongSoLuong }} sp </span>
                                </div>
                            </div>
                            <div class="card-body p-0">
                                <div v-if="sanPhamDaChon.length === 0" class="text-muted py-4 text-center">
                                    <i class="bi bi-cart-x display-6"></i>
                                    <p class="mt-2">Chưa có sản phẩm nào</p>
                                </div>
                                <div v-else class="list-group list-group-flush">
                                    <div v-for="item in sanPhamDaChon" :key="`cart-item-${item.id || item.chiTietSanPhamId}`" class="list-group-item p-3">
                                        <div class="row align-items-center">
                                            <!-- Product Image -->
                                            <div class="col-3">
                                                <div class="position-relative">
                                                    <img :src="getProductImage(item)" :alt="item.tenSanPham || 'Sản phẩm'" class="rounded shadow-sm" style="width: 55px; height: 55px; object-fit: cover" @error="handleImageError" />
                                                    <!-- Color indicator -->
                                                    <div class="position-absolute bottom-0 end-0">
                                                        <span class="color-indicator border border-2 border-white shadow-sm" :style="{ backgroundColor: item.mauSac?.maMau || '#6c757d' }" :title="item.mauSac?.tenMau || 'N/A'"></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Product Info -->
                                            <div class="col-6">
                                                <div class="fw-bold small text-truncate mb-1" :title="item.tenSanPham || 'Sản phẩm'">
                                                    {{ item.tenSanPham || 'Sản phẩm' }}
                                                </div>

                                                <!-- Color and Size badges -->
                                                <div class="d-flex mb-2 gap-1">
                                                    <span class="badge bg-secondary text-dark small bg-opacity-25">
                                                        <span class="color-dot me-1" :style="{ backgroundColor: item.mauSac?.maMau || '#6c757d' }"></span>
                                                        {{ item.mauSac?.tenMau || 'N/A' }}
                                                    </span>
                                                    <span class="badge bg-info text-dark small bg-opacity-25">
                                                        <i class="bi bi-rulers me-1"></i>
                                                        {{ item.kichCo?.tenKichCo || 'N/A' }}
                                                    </span>
                                                </div>

                                                <!-- Price -->
                                                <div class="d-flex align-items-center gap-2">
                                                    <span class="text-danger small fw-bold">
                                                        {{ formatPrice(Number(item.giaBan) || 0) }}
                                                    </span>
                                                    <span v-if="item.giaGoc && Number(item.giaGoc) > Number(item.giaBan)" class="text-decoration-line-through text-muted small">
                                                        {{ formatPrice(Number(item.giaGoc)) }}
                                                    </span>
                                                </div>
                                            </div>

                                            <!-- Quantity Controls - Tất cả trong 1 hàng -->
                                            <div class="col-3">
                                                <div class="d-flex align-items-center justify-content-center gap-1">
                                                    <!-- Decrease Button -->
                                                    <button
                                                        @click="giamSoLuong(item)"
                                                        class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
                                                        type="button"
                                                        title="Giảm số lượng"
                                                        style="width: 24px; height: 24px; padding: 0; border-radius: 4px"
                                                    >
                                                        <span style="font-size: 12px; font-weight: bold">−</span>
                                                    </button>

                                                    <!-- Quantity Display -->
                                                    <span class="fw-bold bg-light rounded border px-2 py-1 text-center" style="min-width: 25px; font-size: 12px; line-height: 1">
                                                        {{ Number(item.soLuongDaChon) || 0 }}
                                                    </span>

                                                    <!-- Increase Button -->
                                                    <button
                                                        @click="tangSoLuong(item)"
                                                        class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
                                                        type="button"
                                                        :disabled="(Number(item.soLuongDaChon) || 0) >= (Number(item.soLuong) || 999)"
                                                        title="Tăng số lượng"
                                                        style="width: 24px; height: 24px; padding: 0; border-radius: 4px"
                                                    >
                                                        <span style="font-size: 12px; font-weight: bold">+</span>
                                                    </button>

                                                    <!-- Delete Button -->
                                                    <button
                                                        @click="xoaKhoiGioHang(item)"
                                                        class="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                                                        title="Xóa sản phẩm"
                                                        style="width: 24px; height: 24px; padding: 0; border-radius: 50%"
                                                    >
                                                        <span style="font-size: 11px">✕</span>
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
                            <div class="card-body p-3">
                                <div class="row mb-2">
                                    <div class="col">Tạm tính ({{ tongQuan.tongSoLuong }} sản phẩm):</div>
                                    <div class="col-auto">{{ formatPrice(tongQuan.tongTienGoc) }}</div>
                                </div>
                                <div v-if="tongQuan.tongTienKhuyenMai < tongQuan.tongTienGoc" class="row text-success mb-2">
                                    <div class="col">Khuyến mãi:</div>
                                    <div class="col-auto">-{{ formatPrice(tongQuan.tongTienGoc - tongQuan.tongTienKhuyenMai) }}</div>
                                </div>
                                <div v-if="voucher" class="row text-success mb-2">
                                    <div class="col">Voucher:</div>
                                    <div class="col-auto">-{{ formatPrice(tongQuan.tongTienVoucher) }}</div>
                                </div>
                                <hr />
                                <div class="row fw-bold h5">
                                    <div class="col">Tổng thanh toán:</div>
                                    <div class="text-danger col-auto">{{ formatPrice(tongQuan.tongTienThanhToan) }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Payment Button -->
                        <button @click="showPaymentModal = true" class="btn btn-success btn-lg w-100" :disabled="sanPhamDaChon.length === 0">
                            <span style="margin-right: 8px">💳</span>
                            Thanh toán ({{ formatPrice(tongQuan.tongTienThanhToan) }})
                        </button>
                    </div>

                    <!-- No Invoice Selected -->
                    <div v-else class="text-muted p-3 text-center">
                        <i class="bi bi-receipt display-1"></i>
                        <h5 class="mt-3">Chọn hoặc tạo hóa đơn</h5>
                        <button @click="taoHoaDonMoi" class="btn btn-primary"><i class="bi bi-plus"></i> Tạo hóa đơn mới</button>
                    </div>
                </div>
            </div>

            <!-- QR Scanner Modal -->
            <div v-if="showQrScanner" class="modal fade show d-block" style="background-color: rgba(0, 0, 0, 0.5)">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="bi bi-qr-code-scan"></i> Quét mã QR</h5>
                            <button @click="showQrScanner = false" class="btn-close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="input-group">
                                <input v-model="qrCode" ref="qrInput" type="text" class="form-control" placeholder="Nhập hoặc quét mã QR sản phẩm" @keyup.enter="quetQR" />
                                <button @click="quetQR" class="btn btn-primary"><i class="bi bi-search"></i> Tìm</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Customer Modal -->
            <div v-if="showCustomerModal" class="modal fade show d-block" style="background-color: rgba(0, 0, 0, 0.5)">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="bi bi-person-search"></i> Chọn khách hàng</h5>
                            <button @click="showCustomerModal = false" class="btn-close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="input-group mb-3">
                                <input v-model="customerSearchKeyword" @input="timKiemKhachHang" type="text" class="form-control" placeholder="Tìm khách hàng theo tên hoặc SĐT" />
                                <button @click="showCreateCustomerForm = true" class="btn btn-success"><i class="bi bi-person-plus"></i> Tạo mới</button>
                            </div>

                            <div class="list-group" style="max-height: 400px; overflow-y: auto">
                                <div v-for="customer in danhSachKhachHang" :key="customer.id" class="list-group-item list-group-item-action" @click="chonKhachHang(customer)">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>{{ customer.hoTen }}</strong
                                            ><br />
                                            <small class="text-muted">{{ customer.sdt }}</small>
                                        </div>
                                        <span class="badge bg-info">{{ customer.diemTichLuy || 0 }} điểm</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Voucher Modal -->
            <div v-if="showVoucherModal" class="modal fade show d-block" style="background-color: rgba(0, 0, 0, 0.5)">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="bi bi-ticket-perforated"></i> Áp dụng voucher</h5>
                            <button @click="showVoucherModal = false" class="btn-close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="input-group mb-3">
                                <input v-model="voucherCode" type="text" class="form-control" placeholder="Nhập mã voucher" @keyup.enter="kiemTraVoucher" />
                                <button @click="kiemTraVoucher" class="btn btn-primary"><i class="bi bi-check-circle"></i> Kiểm tra</button>
                            </div>

                            <div class="row g-3">
                                <div v-for="voucher in danhSachVoucher" :key="voucher.id" class="col-12">
                                    <div class="card border-success" @click="chonVoucher(voucher)">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 class="card-title">{{ voucher.tenVoucher }}</h6>
                                                    <p class="card-text small text-muted">{{ voucher.moTa }}</p>
                                                    <span class="badge bg-success">Giảm {{ formatPrice(voucher.giaTriGiam) }}</span>
                                                </div>
                                                <button class="btn btn-outline-success btn-sm"><i class="bi bi-check"></i> Chọn</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payment Modal -->
            <div v-if="showPaymentModal" class="modal fade show d-block" style="background-color: rgba(0, 0, 0, 0.5)">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="bi bi-credit-card"></i> Thanh toán</h5>
                            <button @click="showPaymentModal = false" class="btn-close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Thông tin thanh toán</h6>
                                    <div class="mb-3">
                                        <label class="form-label">Tổng tiền</label>
                                        <input type="text" class="form-control fw-bold text-danger" :value="formatPrice(tongQuan.tongTienThanhToan)" readonly />
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Tiền mặt</label>
                                        <input v-model.number="thongTinThanhToan.tienMat" type="number" class="form-control" min="0" />
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Chuyển khoản</label>
                                        <input v-model.number="thongTinThanhToan.chuyenKhoan" type="number" class="form-control" min="0" />
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
                                                class="form-control"
                                                min="0"
                                                :max="khachHang.diemTichLuy"
                                                :class="{ 'is-invalid': !validateDiemSuDung() }"
                                                placeholder="Nhập số điểm muốn sử dụng"
                                            />
                                            <span class="input-group-text">điểm</span>
                                        </div>
                                        <div v-if="!validateDiemSuDung()" class="invalid-feedback d-block">Số điểm không hợp lệ. Tối đa {{ khachHang.diemTichLuy }} điểm.</div>
                                        <div v-if="thongTinThanhToan.diemSuDung > 0" class="small text-success mt-1">Giảm {{ formatPrice(thongTinThanhToan.diemSuDung * 1000) }}</div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Ghi chú</label>
                                        <textarea v-model="thongTinThanhToan.ghiChu" class="form-control" rows="3"></textarea>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6>Tóm tắt đơn hàng</h6>
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
                                            <div v-if="thongTinThanhToan.diemSuDung > 0" class="d-flex justify-content-between text-info mb-2">
                                                <span>Điểm tích lũy:</span>
                                                <span>-{{ formatPrice(thongTinThanhToan.diemSuDung * 1000) }}</span>
                                            </div>
                                            <hr />
                                            <div class="d-flex justify-content-between fw-bold h6">
                                                <span>Tổng thanh toán:</span>
                                                <span class="text-danger">{{ formatPrice(tinhTongThanhToan()) }}</span>
                                            </div>
                                            <hr />
                                            <div class="d-flex justify-content-between">
                                                <span>Tiền nhận:</span>
                                                <span>{{ formatPrice(thongTinThanhToan.tienMat + thongTinThanhToan.chuyenKhoan) }}</span>
                                            </div>
                                            <div class="d-flex justify-content-between fw-bold" :class="tinhTienThua() >= 0 ? 'text-success' : 'text-danger'">
                                                <span>{{ tinhTienThua() >= 0 ? 'Tiền thừa:' : 'Còn thiếu:' }}</span>
                                                <span>{{ formatPrice(Math.abs(tinhTienThua())) }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Quick amount buttons -->
                                    <div class="mt-3">
                                        <label class="form-label small">Tiền mặt nhanh:</label>
                                        <div class="d-grid gap-2">
                                            <button v-for="amount in quickAmounts" :key="amount" @click="chonTienNhanh(amount)" class="btn btn-outline-secondary btn-sm">
                                                {{ formatPrice(amount) }}
                                            </button>
                                            <button @click="chonTienVuaVua" class="btn btn-outline-primary btn-sm">Vừa vặn</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button @click="showPaymentModal = false" class="btn btn-secondary"><i class="bi bi-x"></i> Hủy</button>
                            <button @click="xuLyThanhToan" class="btn btn-success" :disabled="!coTheThanhToan()"><i class="bi bi-check-circle"></i> Xác nhận thanh toán</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Product Detail Modal -->
            <div v-if="showProductDetail" class="modal fade show d-block" style="background-color: rgba(0, 0, 0, 0.5)">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="bi bi-eye"></i> Chi tiết sản phẩm</h5>
                            <button @click="showProductDetail = false" class="btn-close"></button>
                        </div>
                        <div class="modal-body" v-if="sanPhamDangXem">
                            <div class="row">
                                <div class="col-md-6">
                                    <img :src="getProductImage(sanPhamDangXem)" :alt="sanPhamDangXem.tenSanPham" class="img-fluid rounded" />
                                </div>
                                <div class="col-md-6">
                                    <h4 class="mb-3">{{ sanPhamDangXem.tenSanPham }}</h4>
                                    <h5 class="text-danger mb-3">{{ formatPrice(sanPhamDangXem.giaBan) }}</h5>

                                    <div v-if="sanPhamDangXem.giaGoc && sanPhamDangXem.giaGoc > sanPhamDangXem.giaBan" class="mb-3">
                                        <span class="text-decoration-line-through text-muted">{{ formatPrice(sanPhamDangXem.giaGoc) }}</span>
                                        <span class="badge bg-success ms-2"> Giảm {{ Math.round((1 - sanPhamDangXem.giaBan / sanPhamDangXem.giaGoc) * 100) }}% </span>
                                    </div>

                                    <div class="row g-3 mb-3">
                                        <div class="col-6">
                                            <label class="form-label small text-muted">Màu sắc</label>
                                            <div class="d-flex align-items-center">
                                                <span class="color-dot-large me-2" :style="{ backgroundColor: sanPhamDangXem.mauSac?.maMau || '#6c757d' }"></span>
                                                <span class="fw-bold">{{ sanPhamDangXem.mauSac?.tenMau || 'Chưa có' }}</span>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <label class="form-label small text-muted">Kích cỡ</label>
                                            <div>
                                                <span class="badge fs-6 bg-primary px-3 py-2">
                                                    {{ sanPhamDangXem.kichCo?.tenKichCo || 'Chưa có' }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="row g-3 mb-3">
                                        <div class="col-6">
                                            <label class="form-label small text-muted">Thương hiệu</label>
                                            <p class="fw-bold mb-0">{{ sanPhamDangXem.thuongHieu?.tenThuongHieu || 'Chưa có' }}</p>
                                        </div>
                                        <div class="col-6">
                                            <label class="form-label small text-muted">Tồn kho</label>
                                            <p class="mb-0">
                                                <span :class="getStockBadgeClass(sanPhamDangXem.soLuong)"> {{ sanPhamDangXem.soLuong }} sản phẩm </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <label class="form-label">Số lượng</label>
                                        <div class="input-group" style="max-width: 150px">
                                            <button @click="giamSoLuongModal" class="btn btn-outline-secondary d-flex align-items-center justify-content-center" :disabled="soLuongChon <= 1" style="width: 40px">
                                                <span style="font-size: 16px; font-weight: bold">−</span>
                                            </button>
                                            <input v-model.number="soLuongChon" type="number" class="form-control text-center" min="1" :max="sanPhamDangXem.soLuong" />
                                            <button @click="tangSoLuongModal" class="btn btn-outline-secondary d-flex align-items-center justify-content-center" :disabled="soLuongChon >= sanPhamDangXem.soLuong" style="width: 40px">
                                                <span style="font-size: 16px; font-weight: bold">+</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button @click="showProductDetail = false" class="btn btn-secondary"><i class="bi bi-x"></i> Đóng</button>
                            <button @click="themVaoHoaDonTuModal" class="btn btn-success" :disabled="!sanPhamDangXem || sanPhamDangXem.soLuong <= 0">
                                <i class="bi bi-cart-plus"></i>
                                Thêm {{ soLuongChon }} vào hóa đơn
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Success Toast -->
            <div v-if="showSuccessToast" class="toast-container position-fixed end-0 top-0 p-3">
                <div class="toast show" role="alert">
                    <div class="toast-header bg-success text-white">
                        <i class="bi bi-check-circle me-2"></i>
                        <strong class="me-auto">Thành công</strong>
                        <button @click="showSuccessToast = false" type="button" class="btn-close btn-close-white"></button>
                    </div>
                    <div class="toast-body">
                        {{ successMessage }}
                    </div>
                </div>
            </div>

            <!-- Error Toast -->
            <div v-if="showErrorToast" class="toast-container position-fixed end-0 top-0 p-3">
                <div class="toast show" role="alert">
                    <div class="toast-header bg-danger text-white">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong class="me-auto">Lỗi</strong>
                        <button @click="showErrorToast = false" type="button" class="btn-close btn-close-white"></button>
                    </div>
                    <div class="toast-body">
                        {{ errorMessage }}
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
            // API Base URL
            const API_BASE_URL = 'http://localhost:8080/api/ban-hang';

            // Reactive data
            const hoaDonCho = ref([]);
            const hoaDonDangChon = ref(null);
            const danhSachSanPham = ref([]);
            const sanPhamDaChon = ref([]);
            const khachHang = ref(null);
            const voucher = ref(null);
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

            // Toasts
            const showSuccessToast = ref(false);
            const showErrorToast = ref(false);
            const successMessage = ref('');
            const errorMessage = ref('');

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

            // Payment info
            const thongTinThanhToan = ref({
                tienMat: 0,
                chuyenKhoan: 0,
                ghiChu: '',
                diemSuDung: 0
            });

            // Quick amounts for payment
            const quickAmounts = ref([50000, 100000, 200000, 500000, 1000000]);

            // Refs
            const searchInput = ref(null);
            const qrInput = ref(null);

            // Debounce timers
            let searchTimer = null;
            let priceFilterTimer = null;

            // Computed
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

            // Methods
            const showToast = (message, isSuccess = true) => {
                if (isSuccess) {
                    successMessage.value = message;
                    showSuccessToast.value = true;
                    setTimeout(() => (showSuccessToast.value = false), 3000);
                } else {
                    errorMessage.value = message;
                    showErrorToast.value = true;
                    setTimeout(() => (showErrorToast.value = false), 3000);
                }
            };

            const loadMasterData = async () => {
                try {
                    // Load danh mục
                    const danhMucResponse = await fetch(`${API_BASE_URL}/master-data/danh-muc`);
                    if (danhMucResponse.ok) {
                        const data = await danhMucResponse.json();
                        if (data.success) danhSachDanhMuc.value = data.data;
                    }

                    // Load thương hiệu
                    const thuongHieuResponse = await fetch(`${API_BASE_URL}/master-data/thuong-hieu`);
                    if (thuongHieuResponse.ok) {
                        const data = await thuongHieuResponse.json();
                        if (data.success) danhSachThuongHieu.value = data.data;
                    }
                } catch (error) {
                    console.error('Lỗi load master data:', error);
                }
            };

            const taoHoaDonMoi = async () => {
                try {
                    const nhanVienId = 1; // Lấy từ session/store
                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho/tao-moi?nhanVienId=${nhanVienId}`, {
                        method: 'POST'
                    });
                    const data = await response.json();

                    console.log('Response tạo hóa đơn mới:', data);

                    if (data.success) {
                        await layDanhSachHoaDonCho();
                        showToast('Tạo hóa đơn mới thành công!');
                    } else {
                        showToast(data.message, false);
                    }
                } catch (error) {
                    console.error('Lỗi tạo hóa đơn mới:', error);
                    showToast('Lỗi tạo hóa đơn mới', false);
                }
            };

            const layDanhSachHoaDonCho = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho`);
                    const data = await response.json();

                    console.log('Response danh sách hóa đơn chờ:', data);

                    if (data.success) {
                        hoaDonCho.value = data.data;
                        if (hoaDonCho.value.length > 0 && !hoaDonDangChon.value) {
                            chonHoaDon(hoaDonCho.value[0]);
                        }
                    }
                } catch (error) {
                    console.error('Lỗi lấy danh sách hóa đơn chờ:', error);
                }
            };

            const chonHoaDon = async (hoaDon) => {
                console.log('Chọn hóa đơn:', hoaDon);
                hoaDonDangChon.value = hoaDon;
                await layTongQuanHoaDon(hoaDon.id);
            };

            const layTongQuanHoaDon = async (hoaDonId) => {
                try {
                    console.log('🔍 Lấy tổng quan hóa đơn ID:', hoaDonId);

                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho/${hoaDonId}/tong-quan`);
                    const data = await response.json();

                    console.log('📥 Raw API Response:', data);

                    if (data.success && data.data) {
                        const tongQuanData = data.data;
                        console.log('📊 Tổng quan data:', tongQuanData);

                        // Xử lý danh sách sản phẩm an toàn
                        if (tongQuanData.danhSachSanPham && Array.isArray(tongQuanData.danhSachSanPham)) {
                            sanPhamDaChon.value = tongQuanData.danhSachSanPham.map((item, index) => {
                                console.log(`📦 Mapping sản phẩm ${index}:`, item);

                                // Tạo object an toàn với fallback values
                                const mappedItem = {
                                    id: item.id || `temp_${Date.now()}_${index}`,
                                    chiTietSanPhamId: item.chiTietSanPhamId || item.id,
                                    tenSanPham: item.tenSanPham || 'Sản phẩm không xác định',
                                    soLuongDaChon: Number(item.soLuong) || 1,
                                    giaBan: Number(item.giaBan) || Number(item.tongTienSauGiam) / Math.max(1, Number(item.soLuong)) || 0,
                                    giaGoc: Number(item.giaGoc) || Number(item.tongTienGoc) / Math.max(1, Number(item.soLuong)) || 0,
                                    soLuong: 999, // Tồn kho - set mặc định cao để không bị limit
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
                                };

                                console.log(`✅ Mapped item ${index}:`, mappedItem);
                                return mappedItem;
                            });
                        } else {
                            console.log('⚠️ Không có danhSachSanPham hoặc không phải array');
                            sanPhamDaChon.value = [];
                        }

                        // Map thông tin khách hàng
                        khachHang.value = tongQuanData.khachHang || null;
                        voucher.value = tongQuanData.voucher || null;

                        console.log('🎯 Final sanPhamDaChon:', sanPhamDaChon.value);
                        console.log('👤 Khách hàng:', khachHang.value);
                        console.log('🎫 Voucher:', voucher.value);
                    } else {
                        console.error('❌ API response không hợp lệ:', data);
                        sanPhamDaChon.value = [];
                    }
                } catch (error) {
                    console.error('💥 Lỗi lấy tổng quan hóa đơn:', error);
                    sanPhamDaChon.value = [];
                    showToast('Lỗi tải thông tin hóa đơn', false);
                }
            };

            const xoaHoaDon = async (hoaDonId) => {
                if (!confirm('Bạn có chắc muốn xóa hóa đơn này?')) return;

                try {
                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho/${hoaDonId}`, {
                        method: 'DELETE'
                    });
                    const data = await response.json();

                    if (data.success) {
                        await layDanhSachHoaDonCho();
                        showToast('Xóa hóa đơn thành công!');
                    } else {
                        showToast(data.message, false);
                    }
                } catch (error) {
                    showToast('Lỗi xóa hóa đơn', false);
                }
            };

            const timKiemSanPham = async (page = 0) => {
                loading.value = true;
                error.value = '';

                try {
                    const params = new URLSearchParams({
                        keyword: searchKeyword.value,
                        page: page.toString(),
                        size: '20',
                        sortBy: 'ngayTao',
                        sortDir: 'desc'
                    });

                    if (filters.value.danhMucId) params.append('danhMucId', filters.value.danhMucId);
                    if (filters.value.thuongHieuId) params.append('thuongHieuId', filters.value.thuongHieuId);
                    if (filters.value.minPrice) params.append('minPrice', filters.value.minPrice);
                    if (filters.value.maxPrice) params.append('maxPrice', filters.value.maxPrice);

                    const response = await fetch(`${API_BASE_URL}/san-pham?${params}`);
                    const data = await response.json();

                    if (data.success) {
                        danhSachSanPham.value = data.data;
                        trangHienTai.value = data.currentPage;
                        tongSoTrang.value = data.totalPages;
                        tongSoPhanTu.value = data.totalElements;
                    } else {
                        error.value = data.message || 'Có lỗi xảy ra khi tải sản phẩm';
                    }
                } catch (err) {
                    error.value = 'Không thể kết nối đến server';
                } finally {
                    loading.value = false;
                }
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
                timKiemSanPham(0);
            };

            const chuyenTrang = (page) => {
                if (page >= 0 && page < tongSoTrang.value) {
                    timKiemSanPham(page);
                }
            };

            const taiLaiSanPham = () => {
                timKiemSanPham(0);
            };

            const xemChiTietSanPham = (product) => {
                sanPhamDangXem.value = product;
                soLuongChon.value = 1;
                showProductDetail.value = true;
            };

            const themVaoHoaDon = async (product, soLuong = 1) => {
                if (!hoaDonDangChon.value) {
                    showToast('Vui lòng chọn hóa đơn trước', false);
                    return;
                }

                // Validation dữ liệu đầu vào
                if (!product || !product.id) {
                    showToast('Thông tin sản phẩm không hợp lệ', false);
                    return;
                }

                if (!Number.isInteger(soLuong) || soLuong <= 0) {
                    showToast('Số lượng phải là số nguyên dương', false);
                    return;
                }

                try {
                    console.log('➕ Thêm sản phẩm vào hóa đơn:', {
                        productId: product.id,
                        productName: product.tenSanPham,
                        soLuong: soLuong,
                        hoaDonId: hoaDonDangChon.value.id
                    });

                    const request = {
                        chiTietSanPhamId: Number(product.id),
                        soLuong: Number(soLuong),
                        donGia: Number(product.giaBan) || 0
                    };

                    console.log('📤 Request data:', request);

                    // Validate request data
                    if (!request.chiTietSanPhamId || !request.soLuong || request.donGia < 0) {
                        throw new Error('Dữ liệu request không hợp lệ');
                    }

                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/them-san-pham`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(request)
                    });

                    console.log('📡 Response status:', response.status);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('📥 Response data:', data);

                    if (data.success) {
                        // Cập nhật local state optimistically
                        const existingItemIndex = sanPhamDaChon.value.findIndex((item) => item.chiTietSanPhamId === product.id || item.id === product.id);

                        if (existingItemIndex > -1) {
                            // Cập nhật số lượng cho sản phẩm đã có
                            sanPhamDaChon.value[existingItemIndex].soLuongDaChon = (sanPhamDaChon.value[existingItemIndex].soLuongDaChon || 0) + soLuong;
                        } else {
                            // Thêm sản phẩm mới
                            const newItem = {
                                id: `temp_${Date.now()}`,
                                chiTietSanPhamId: product.id,
                                tenSanPham: product.tenSanPham || 'Sản phẩm',
                                soLuongDaChon: soLuong,
                                giaBan: Number(product.giaBan) || 0,
                                giaGoc: Number(product.giaGoc) || Number(product.giaBan) || 0,
                                soLuong: Number(product.soLuong) || 999,
                                mauSac: {
                                    tenMau: product.mauSac?.tenMau || product.mauSac?.tenMauSac || 'N/A',
                                    maMau: getMauHex(product.mauSac?.tenMau || product.mauSac?.tenMauSac)
                                },
                                kichCo: {
                                    tenKichCo: product.kichCo?.tenKichCo || 'N/A'
                                },
                                thuongHieu: {
                                    tenThuongHieu: product.thuongHieu?.tenThuongHieu || 'N/A'
                                },
                                hinhAnhChinh: product.hinhAnhChinh
                            };
                            sanPhamDaChon.value.push(newItem);
                        }

                        showToast(`Đã thêm ${product.tenSanPham} vào hóa đơn!`);

                        // Reload từ server để đồng bộ
                        setTimeout(() => {
                            layTongQuanHoaDon(hoaDonDangChon.value.id);
                        }, 500);
                    } else {
                        showToast(data.message || 'Lỗi thêm sản phẩm', false);
                    }
                } catch (error) {
                    console.error('💥 Lỗi thêm sản phẩm:', error);
                    showToast(`Lỗi thêm sản phẩm: ${error.message}`, false);
                }
            };

            const themVaoHoaDonTuModal = () => {
                themVaoHoaDon(sanPhamDangXem.value, soLuongChon.value);
                showProductDetail.value = false;
            };

            const tangSoLuong = async (item) => {
                // Validation đầu vào
                if (!item || !item.id) {
                    console.error('❌ Item không hợp lệ:', item);
                    showToast('Dữ liệu sản phẩm không hợp lệ', false);
                    return;
                }

                if (!hoaDonDangChon.value?.id) {
                    showToast('Chưa chọn hóa đơn', false);
                    return;
                }

                const soLuongHienTai = Number(item.soLuongDaChon) || 0;
                const soLuongTon = Number(item.soLuong) || 0;

                if (soLuongHienTai >= soLuongTon && soLuongTon > 0) {
                    showToast('Không đủ số lượng tồn kho', false);
                    return;
                }

                try {
                    const soLuongMoi = soLuongHienTai + 1;
                    const request = {
                        soLuong: soLuongMoi,
                        donGia: Number(item.giaBan) || 0
                    };

                    // Validation request
                    if (request.soLuong <= 0 || request.donGia < 0) {
                        throw new Error('Dữ liệu request không hợp lệ');
                    }

                    console.log('⬆️ Tăng số lượng:', {
                        itemId: item.id,
                        currentQty: soLuongHienTai,
                        newQty: soLuongMoi,
                        request
                    });

                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/cap-nhat-san-pham/${item.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(request)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    console.log('📥 Response tăng số lượng:', data);

                    if (data.success) {
                        // Cập nhật local state ngay
                        item.soLuongDaChon = soLuongMoi;

                        // Sync với server
                        setTimeout(() => {
                            layTongQuanHoaDon(hoaDonDangChon.value.id);
                        }, 300);
                    } else {
                        showToast(data.message || 'Lỗi cập nhật số lượng', false);
                    }
                } catch (error) {
                    console.error('💥 Lỗi tăng số lượng:', error);
                    showToast(`Lỗi cập nhật: ${error.message}`, false);
                }
            };

            const giamSoLuong = async (item) => {
                // Validation đầu vào
                if (!item || !item.id) {
                    console.error('❌ Item không hợp lệ:', item);
                    showToast('Dữ liệu sản phẩm không hợp lệ', false);
                    return;
                }

                if (!hoaDonDangChon.value?.id) {
                    showToast('Chưa chọn hóa đơn', false);
                    return;
                }

                const soLuongHienTai = Number(item.soLuongDaChon) || 0;

                if (soLuongHienTai <= 1) {
                    // Nếu số lượng <= 1 thì xóa sản phẩm
                    xoaKhoiGioHang(item);
                    return;
                }

                try {
                    const soLuongMoi = soLuongHienTai - 1;
                    const request = {
                        soLuong: soLuongMoi,
                        donGia: Number(item.giaBan) || 0
                    };

                    // Validation request
                    if (request.soLuong <= 0 || request.donGia < 0) {
                        throw new Error('Dữ liệu request không hợp lệ');
                    }

                    console.log('⬇️ Giảm số lượng:', {
                        itemId: item.id,
                        currentQty: soLuongHienTai,
                        newQty: soLuongMoi,
                        request
                    });

                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/cap-nhat-san-pham/${item.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(request)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    console.log('📥 Response giảm số lượng:', data);

                    if (data.success) {
                        // Cập nhật local state ngay
                        item.soLuongDaChon = soLuongMoi;

                        // Sync với server
                        setTimeout(() => {
                            layTongQuanHoaDon(hoaDonDangChon.value.id);
                        }, 300);
                    } else {
                        showToast(data.message || 'Lỗi cập nhật số lượng', false);
                    }
                } catch (error) {
                    console.error('💥 Lỗi giảm số lượng:', error);
                    showToast(`Lỗi cập nhật: ${error.message}`, false);
                }
            };

            const xoaKhoiGioHang = async (item) => {
                // Validation đầu vào
                if (!item || !item.id) {
                    console.error('❌ Item không hợp lệ:', item);
                    showToast('Dữ liệu sản phẩm không hợp lệ', false);
                    return;
                }

                if (!hoaDonDangChon.value?.id) {
                    showToast('Chưa chọn hóa đơn', false);
                    return;
                }

                const tenSanPham = item.tenSanPham || 'sản phẩm này';
                if (!confirm(`Bạn có chắc muốn xóa "${tenSanPham}" khỏi hóa đơn?`)) {
                    return;
                }

                try {
                    console.log('🗑️ Xóa sản phẩm:', {
                        itemId: item.id,
                        productName: tenSanPham,
                        hoaDonId: hoaDonDangChon.value.id
                    });

                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/xoa-san-pham/${item.id}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    console.log('📥 Response xóa sản phẩm:', data);

                    if (data.success) {
                        // Xóa khỏi local state ngay
                        const index = sanPhamDaChon.value.findIndex((sp) => sp.id === item.id);
                        if (index > -1) {
                            sanPhamDaChon.value.splice(index, 1);
                        }

                        showToast(`Đã xóa ${tenSanPham} khỏi hóa đơn`);

                        // Sync với server
                        setTimeout(() => {
                            layTongQuanHoaDon(hoaDonDangChon.value.id);
                        }, 300);
                    } else {
                        showToast(data.message || 'Lỗi xóa sản phẩm', false);
                    }
                } catch (error) {
                    console.error('💥 Lỗi xóa sản phẩm:', error);
                    showToast(`Lỗi xóa sản phẩm: ${error.message}`, false);
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
                    const response = await fetch(`${API_BASE_URL}/san-pham/scan-qr`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ qrCode: qrCode.value })
                    });

                    const data = await response.json();

                    if (data.success) {
                        showQrScanner.value = false;
                        qrCode.value = '';
                        await themVaoHoaDon(data.data);
                    } else {
                        showToast(data.message, false);
                    }
                } catch (error) {
                    showToast('Lỗi quét QR code', false);
                }
            };

            const timKiemKhachHang = async () => {
                try {
                    const params = new URLSearchParams({
                        keyword: customerSearchKeyword.value,
                        page: '0',
                        size: '10'
                    });

                    const response = await fetch(`${API_BASE_URL}/khach-hang/search?${params}`);
                    const data = await response.json();

                    if (data.success) {
                        danhSachKhachHang.value = data.data;
                    }
                } catch (error) {
                    console.error('Lỗi tìm kiếm khách hàng:', error);
                }
            };

            const chonKhachHang = async (customer) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/ap-dung-khach-hang/${customer.id}`, {
                        method: 'POST'
                    });

                    const data = await response.json();

                    if (data.success) {
                        khachHang.value = customer;
                        showCustomerModal.value = false;
                        customerSearchKeyword.value = '';
                        showToast(`Đã áp dụng khách hàng ${customer.hoTen}`);
                    } else {
                        showToast(data.message, false);
                    }
                } catch (error) {
                    showToast('Lỗi áp dụng khách hàng', false);
                }
            };

            const boKhachHang = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/bo-khach-hang`, {
                        method: 'DELETE'
                    });

                    const data = await response.json();

                    if (data.success) {
                        khachHang.value = null;
                        showToast('Đã bỏ khách hàng');
                    } else {
                        showToast(data.message, false);
                    }
                } catch (error) {
                    showToast('Lỗi bỏ khách hàng', false);
                }
            };

            const layDanhSachVoucher = async () => {
                try {
                    const tongTien = tongQuan.value.tongTienKhuyenMai;
                    const khachHangId = khachHang.value?.id;

                    const params = new URLSearchParams();
                    if (khachHangId) params.append('khachHangId', khachHangId);
                    if (tongTien) params.append('tongTien', tongTien);

                    const response = await fetch(`${API_BASE_URL}/voucher/kha-dung?${params}`);
                    const data = await response.json();

                    if (data.success) {
                        danhSachVoucher.value = data.data;
                    }
                } catch (error) {
                    console.error('Lỗi lấy danh sách voucher:', error);
                }
            };

            const kiemTraVoucher = async () => {
                if (!voucherCode.value.trim()) return;

                try {
                    const request = {
                        maVoucher: voucherCode.value,
                        tongTien: tongQuan.value.tongTienKhuyenMai,
                        khachHangId: khachHang.value?.id
                    };

                    const response = await fetch(`${API_BASE_URL}/voucher/kiem-tra`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(request)
                    });

                    const data = await response.json();

                    if (data.valid) {
                        chonVoucher(data.voucher);
                        voucherCode.value = '';
                    } else {
                        showToast(data.message, false);
                    }
                } catch (error) {
                    showToast('Lỗi kiểm tra voucher', false);
                }
            };

            const chonVoucher = async (selectedVoucher) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/ap-dung-voucher/${selectedVoucher.id}`, {
                        method: 'POST'
                    });

                    const data = await response.json();

                    if (data.success) {
                        voucher.value = selectedVoucher;
                        showVoucherModal.value = false;
                        voucherCode.value = '';
                        showToast(`Đã áp dụng voucher ${selectedVoucher.tenVoucher}`);
                    } else {
                        showToast(data.message, false);
                    }
                } catch (error) {
                    showToast('Lỗi áp dụng voucher', false);
                }
            };

            const boVoucher = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/bo-voucher`, {
                        method: 'DELETE'
                    });

                    const data = await response.json();

                    if (data.success) {
                        voucher.value = null;
                        showToast('Đã bỏ voucher');
                    } else {
                        showToast(data.message, false);
                    }
                } catch (error) {
                    showToast('Lỗi bỏ voucher', false);
                }
            };

            const tinhTongThanhToan = () => {
                let tong = tongQuan.value.tongTienThanhToan;
                if (thongTinThanhToan.value.diemSuDung > 0) {
                    tong -= thongTinThanhToan.value.diemSuDung * 1000; // 1 điểm = 1000 VND
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
                console.log('💳 Bắt đầu xử lý thanh toán...');

                // Validation cơ bản
                if (!hoaDonDangChon.value?.id) {
                    showToast('Chưa chọn hóa đơn để thanh toán', false);
                    return;
                }

                if (!sanPhamDaChon.value || sanPhamDaChon.value.length === 0) {
                    showToast('Hóa đơn chưa có sản phẩm nào', false);
                    return;
                }

                const tongTienCanThanhToan = tinhTongThanhToan();
                console.log('💰 Tổng tiền cần thanh toán:', tongTienCanThanhToan);

                if (tongTienCanThanhToan <= 0) {
                    showToast('Tổng tiền thanh toán không hợp lệ', false);
                    return;
                }

                if (!coTheThanhToan()) {
                    showToast('Thông tin thanh toán chưa đủ', false);
                    return;
                }

                try {
                    // Chuẩn bị dữ liệu request với validation
                    const requestData = {
                        loaiHoaDon: 'OFFLINE', // Fixed value cho POS
                        ghiChu: String(thongTinThanhToan.value.ghiChu || '').trim()
                    };

                    // Thêm khách hàng nếu có
                    if (khachHang.value?.id) {
                        requestData.khachHangId = Number(khachHang.value.id);
                        console.log('👤 Khách hàng ID:', requestData.khachHangId);
                    }

                    // Thêm voucher nếu có
                    if (voucher.value?.id) {
                        requestData.voucherId = Number(voucher.value.id);
                        console.log('🎫 Voucher ID:', requestData.voucherId);
                    }

                    // Thêm điểm sử dụng nếu có
                    const diemSuDung = Number(thongTinThanhToan.value.diemSuDung) || 0;
                    if (diemSuDung > 0) {
                        // Validate điểm sử dụng
                        const maxDiem = khachHang.value?.diemTichLuy || 0;
                        if (diemSuDung > maxDiem) {
                            showToast(`Chỉ có thể sử dụng tối đa ${maxDiem} điểm`, false);
                            return;
                        }
                        requestData.diemSuDung = diemSuDung;
                        console.log('⭐ Điểm sử dụng:', requestData.diemSuDung);
                    }

                    console.log('📤 Request thanh toán:', requestData);

                    // Validate request data
                    if (!requestData.loaiHoaDon) {
                        throw new Error('Loại hóa đơn không được để trống');
                    }

                    const response = await fetch(`${API_BASE_URL}/hoa-don-cho/${hoaDonDangChon.value.id}/thanh-toan`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    });

                    console.log('📡 Response status:', response.status);
                    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('❌ HTTP Error:', response.status, errorText);
                        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
                    }

                    const data = await response.json();
                    console.log('📥 Response thanh toán:', data);

                    if (data.success) {
                        // Thanh toán thành công
                        showPaymentModal.value = false;
                        resetThanhToan();

                        // Reload danh sách hóa đơn chờ
                        await layDanhSachHoaDonCho();

                        showToast('💰 Thanh toán thành công!');

                        // Log thông tin hóa đơn đã thanh toán
                        console.log('✅ Hóa đơn đã thanh toán:', data.data);

                        // TODO: Có thể mở modal in hóa đơn ở đây
                    } else {
                        const errorMsg = data.message || 'Thanh toán thất bại';
                        console.error('❌ Thanh toán thất bại:', errorMsg);
                        showToast(errorMsg, false);
                    }
                } catch (error) {
                    console.error('💥 Lỗi xử lý thanh toán:', error);

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

                    showToast(errorMessage, false);
                }
            };

            const resetThanhToan = () => {
                thongTinThanhToan.value = {
                    tienMat: 0,
                    chuyenKhoan: 0,
                    ghiChu: '',
                    diemSuDung: 0
                };
                khachHang.value = null;
                voucher.value = null;
            };

            // Utility functions
            const formatPrice = (price) => {
                if (!price) return '0₫';
                return new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(price);
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
                // Kiểm tra nếu có hình ảnh chính từ API
                if (product.hinhAnhChinh && product.hinhAnhChinh !== 'null') {
                    // Nếu URL đã đầy đủ, trả về trực tiếp
                    if (product.hinhAnhChinh.startsWith('http')) {
                        return product.hinhAnhChinh;
                    }
                    // Nếu chưa có protocol, thêm base URL
                    return `http://localhost:8080${product.hinhAnhChinh}`;
                }

                // Kiểm tra trong danh sách hình ảnh
                if (product.danhSachHinhAnh && product.danhSachHinhAnh.length > 0) {
                    const hinhAnh = product.danhSachHinhAnh[0];
                    if (hinhAnh.urlHinhAnh) {
                        return hinhAnh.urlHinhAnh;
                    }
                    if (hinhAnh.duongDan) {
                        return `http://localhost:8080/hinh-anh/images/${hinhAnh.duongDan.replace(/^\/+/, '')}`;
                    }
                }

                // Fallback về ảnh mặc định
                return 'https://via.placeholder.com/200x200?text=No+Image';
            };

            const handleImageError = (event) => {
                console.warn('Lỗi load ảnh:', event.target.src);
                event.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
            };

            const getStockBadgeClass = (soLuong) => {
                if (soLuong <= 0) return 'badge bg-danger';
                if (soLuong <= 5) return 'badge bg-warning text-dark';
                return 'badge bg-success';
            };

            // Watchers
            watch(showCustomerModal, (newVal) => {
                if (newVal) {
                    timKiemKhachHang();
                }
            });

            watch(showVoucherModal, (newVal) => {
                if (newVal) {
                    layDanhSachVoucher();
                }
            });

            watch(showQrScanner, (newVal) => {
                if (newVal) {
                    nextTick(() => {
                        qrInput.value?.focus();
                    });
                }
            });

            // Lifecycle
            onMounted(async () => {
                await loadMasterData();
                await layDanhSachHoaDonCho();

                // Nếu chưa có hóa đơn nào, tạo hóa đơn mới
                if (hoaDonCho.value.length === 0) {
                    await taoHoaDonMoi();
                }

                // Load sản phẩm
                await timKiemSanPham(0);
            });

            return {
                // Data
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
                tongQuan,

                // Modals
                showCustomerModal,
                showVoucherModal,
                showPaymentModal,
                showProductDetail,
                sanPhamDangXem,
                showQrScanner,
                showCreateCustomerForm,

                // Toasts
                showSuccessToast,
                showErrorToast,
                successMessage,
                errorMessage,

                // Refs
                searchInput,
                qrInput,

                // Methods
                taoHoaDonMoi,
                layDanhSachHoaDonCho,
                chonHoaDon,
                xoaHoaDon,
                timKiemSanPham,
                debounceSearch,
                debouncePriceFilter,
                applyFilters,
                resetFilters,
                chuyenTrang,
                taiLaiSanPham,
                xemChiTietSanPham,
                themVaoHoaDon,
                themVaoHoaDonTuModal,
                tangSoLuong,
                giamSoLuong,
                xoaKhoiGioHang,
                tangSoLuongModal,
                giamSoLuongModal,
                quetQR,
                timKiemKhachHang,
                chonKhachHang,
                boKhachHang,
                layDanhSachVoucher,
                kiemTraVoucher,
                chonVoucher,
                boVoucher,
                tinhTongThanhToan,
                tinhTienThua,
                coTheThanhToan,
                chonTienNhanh,
                chonTienVuaVua,
                xuLyThanhToan,
                formatPrice,
                getProductImage,
                handleImageError,
                getStockBadgeClass
            };
        }
    };
    </script>

    <style scoped>
    .pos-container {
        height: 100vh;
        overflow: hidden;
    }

    .left-panel {
        border-right: 2px solid #dee2e6;
        height: 100vh;
        overflow-y: auto;
    }

    .right-panel {
        height: 100vh;
        overflow-y: auto;
        background-color: #f8f9fa;
    }

    .invoice-tabs {
        border-bottom: 1px solid #dee2e6;
        background-color: #fff;
    }

    .invoice-tab {
        padding: 0.5rem 1rem;
        border: 1px solid #dee2e6;
        border-radius: 0.375rem 0.375rem 0 0;
        background-color: #f8f9fa;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.875rem;
        min-width: 80px;
    }

    .invoice-tab:hover {
        background-color: #e9ecef;
    }

    .invoice-tab.active {
        background-color: #fff;
        border-bottom-color: #fff;
        position: relative;
        z-index: 1;
    }

    .invoice-close-btn:hover {
        background-color: rgba(220, 53, 69, 0.1) !important;
        border-radius: 50%;
    }

    .product-card {
        transition: all 0.3s ease;
        cursor: pointer;
        border: 1px solid #dee2e6;
    }

    .product-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-color: #007bff;
    }

    .product-img {
        transition: transform 0.3s ease;
    }

    .product-card:hover .product-img {
        transform: scale(1.05);
    }

    .color-dot {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.2);
    }

    .color-dot-large {
        display: inline-block;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    }

    .invoice-content {
        background-color: #fff;
    }

    .card {
        border: 1px solid #dee2e6;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }

    .card-header {
        background-color: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
    }

    .list-group-item {
        border-color: #dee2e6;
    }

    .list-group-item:hover {
        background-color: #f8f9fa;
    }

    .modal.show {
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .toast-container {
        z-index: 1060;
    }

    .btn-sm {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
    }

    .input-group-sm .form-control,
    .input-group-sm .btn {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .pos-container {
            height: auto;
        }

        .left-panel,
        .right-panel {
            height: auto;
        }

        .col-8 {
            flex: 0 0 auto;
            width: 100%;
        }

        .col-4 {
            flex: 0 0 auto;
            width: 100%;
        }
    }

    @media (max-width: 576px) {
        .col-xl-3 {
            flex: 0 0 auto;
            width: 50%;
        }
    }

    /* Custom scrollbar */
    .left-panel::-webkit-scrollbar,
    .right-panel::-webkit-scrollbar {
        width: 6px;
    }

    .left-panel::-webkit-scrollbar-track,
    .right-panel::-webkit-scrollbar-track {
        background: #f1f1f1;
    }

    .left-panel::-webkit-scrollbar-thumb,
    .right-panel::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
    }

    .left-panel::-webkit-scrollbar-thumb:hover,
    .right-panel::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }

    /* Print styles */
    @media print {
        .pos-container {
            height: auto;
        }

        .left-panel {
            display: none;
        }

        .right-panel {
            width: 100%;
            height: auto;
        }
    }
    </style>
