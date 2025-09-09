<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Xóa đã chọn" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedCustomers || !selectedCustomers.length" />
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-upload" severity="secondary" @click="exportCSV" :loading="exporting" />
                <Button label="Quản lý tài khoản" icon="pi pi-plus" @click="goToAccountManagement" class="ml-2" />
            </template>
        </Toolbar>

        <!-- DataTable -->
        <DataTable
            ref="dt"
            v-model:selection="selectedCustomers"
            :value="filteredCustomers"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} khách hàng"
            :loading="isLoading"
        >
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <h4 class="m-0">Quản Lý Khách Hàng</h4>
                    <div class="flex gap-2">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Tìm kiếm..." />
                        </IconField>
                        <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Lọc trạng thái" class="w-12rem" />
                    </div>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="ID" sortable style="width: 6rem">
                <template #body="slotProps">
                    <span class="font-bold text-primary">#{{ slotProps.data.id }}</span>
                </template>
            </Column>
            <Column field="maKhachHang" header="Mã KH" sortable style="width: 10rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.maKhachHang" severity="secondary" />
                </template>
            </Column>
            <Column field="hoTen" header="Thông tin" sortable style="min-width: 18rem">
                <template #body="slotProps">
                    <div class="flex items-center">
                        <span class="rounded-circle w-2rem h-2rem mr-3 flex items-center justify-center font-bold text-white" :style="{ background: 'linear-gradient(45deg, #007bff, #6f42c1)' }">
                            {{ getInitials(slotProps.data.hoTen) }}
                        </span>
                        <div class="flex flex-col">
                            <span class="font-semibold">{{ slotProps.data.hoTen }}</span>
                            <span class="text-muted text-sm">{{ slotProps.data.email }}</span>
                        </div>
                    </div>
                </template>
            </Column>
            <Column header="Liên hệ" style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex flex-col">
                        <span class="mb-1">
                            <i class="pi pi-phone text-muted mr-1"></i>
                            {{ slotProps.data.sdt }}
                        </span>
                        <span class="text-muted text-sm">
                            <i class="pi pi-user text-muted mr-1"></i>
                            ID TK: {{ slotProps.data.idTaiKhoan || 'Chưa có tài khoản' }}
                        </span>
                    </div>
                </template>
            </Column>
            <!-- Cột địa chỉ hiển thị từ KhachHangDto -->
<Column header="Địa chỉ" style="min-width: 18rem">
    <template #body="slotProps">
        <div class="flex flex-col">
            <!-- Địa chỉ mặc định -->
            <div v-if="slotProps.data.diaChiMacDinh" class="mb-2">
                <div class="flex items-center mb-1">
                    <i class="pi pi-home text-primary mr-1"></i>
                    <span class="font-semibold text-primary text-sm">Địa chỉ mặc định</span>
                    <Tag value="Mặc định" severity="success" class="ml-2 text-xs" />
                </div>
                <span class="text-sm text-muted">
                    <i class="pi pi-map-marker text-muted mr-1"></i>
                    {{ slotProps.data.diaChiMacDinh.diaChiDayDu || formatAddressFromInfo(slotProps.data.diaChiMacDinh) }}
                </span>
            </div>
            
            <!-- Tổng số địa chỉ -->
            <div v-if="slotProps.data.danhSachDiaChi && slotProps.data.danhSachDiaChi.length > 1" class="flex items-center">
                <i class="pi pi-list text-muted mr-1"></i>
                <span class="text-xs text-muted">
                    {{ slotProps.data.danhSachDiaChi.length }} địa chỉ
                </span>
                <Button 
                    icon="pi pi-eye" 
                    text 
                    size="small" 
                    class="ml-2 p-1" 
                    @click="viewAllAddresses(slotProps.data)"
                    title="Xem tất cả địa chỉ"
                />
            </div>
            
            <!-- Trường hợp chưa có địa chỉ -->
            <div v-if="!slotProps.data.diaChiMacDinh && (!slotProps.data.danhSachDiaChi || slotProps.data.danhSachDiaChi.length === 0)" class="text-center py-2">
                <i class="pi pi-map-marker text-muted"></i>
                <span class="text-sm text-muted ml-1">Chưa có địa chỉ</span>
            </div>
        </div>
    </template>
</Column>
            <Column header="Điểm tích lũy" style="width: 10rem">
                <template #body="slotProps">
                    <div class="flex items-center">
                        <i class="pi pi-star mr-1 text-yellow-500"></i>
                        <span class="font-semibold">ID Ví: {{ slotProps.data.idViDiem || 'N/A' }}</span>
                    </div>
                </template>
            </Column>
            <Column field="trangThai" header="Trạng thái" sortable style="width: 12rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.trangThai === 1 ? 'Hoạt động' : 'Ngưng'" :severity="slotProps.data.trangThai === 1 ? 'success' : 'danger'">
                        <i :class="slotProps.data.trangThai === 1 ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1"></i>
                        {{ slotProps.data.trangThai === 1 ? 'Hoạt động' : 'Ngưng' }}
                    </Tag>
                </template>
            </Column>
            <Column field="ngayTao" header="Ngày tạo" sortable style="width: 10rem">
                <template #body="slotProps">
                    <span class="text-sm">{{ formatDate(slotProps.data.ngayTao) }}</span>
                </template>
            </Column>
            <Column :exportable="false" style="width: 12rem">
                <template #body="slotProps">
                    <div class="flex gap-1">
                        <Button icon="pi pi-eye" outlined size="small" @click="viewCustomer(slotProps.data)" title="Xem chi tiết" />
                        <Button icon="pi pi-pencil" outlined size="small" @click="editCustomer(slotProps.data)" title="Sửa" />
                        <Button icon="pi pi-trash" outlined severity="danger" size="small" @click="confirmDeleteCustomer(slotProps.data)" title="Xóa" />
                        <Button icon="pi pi-refresh" outlined severity="secondary" size="small" @click="changeStatus(slotProps.data)" :title="slotProps.data.trangThai === 1 ? 'Ngưng hoạt động' : 'Kích hoạt'" />
                    </div>
                </template>
            </Column>
            <template #empty>
                <div class="p-5 text-center">
                    <i class="pi pi-users text-muted mb-3 text-5xl"></i>
                    <h5 class="text-muted">Không tìm thấy khách hàng</h5>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm khách hàng mới trong phần quản lý tài khoản.</p>
                    <div class="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3">
                        <p class="text-sm text-yellow-700">
                            <strong>Debug Info:</strong><br />
                            - Tổng khách hàng: {{ customers.length }}<br />
                            - Sau filter: {{ filteredCustomers.length }}<br />
                            - Status filter: {{ statusFilter || 'Không có' }}<br />
                            - Loading: {{ isLoading ? 'Đang tải...' : 'Đã tải xong' }}
                        </p>
                        <Button label="Tải lại dữ liệu" icon="pi pi-refresh" size="small" @click="fetchData" class="mt-2" />
                    </div>
                </div>
            </template>
        </DataTable>

        <!-- View Customer Dialog -->
        <Dialog v-model:visible="viewDialog" :style="{ width: '700px' }" :header="`Chi tiết khách hàng - ${viewingCustomer?.hoTen || 'N/A'}`" :modal="true">
            <div v-if="viewingCustomer" class="flex flex-col gap-4">
                <!-- Thông tin cơ bản -->
                <div class="rounded-lg bg-blue-50 p-4">
                    <h6 class="mb-3 font-semibold text-blue-700">Thông tin khách hàng:</h6>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>ID:</strong> #{{ viewingCustomer.id }}</div>
                        <div><strong>Mã KH:</strong> {{ viewingCustomer.maKhachHang }}</div>
                        <div><strong>Họ tên:</strong> {{ viewingCustomer.hoTen }}</div>
                        <div><strong>Email:</strong> {{ viewingCustomer.email }}</div>
                        <div><strong>SĐT:</strong> {{ viewingCustomer.sdt }}</div>
                        <div>
                            <strong>Trạng thái:</strong>
                            <Tag :value="viewingCustomer.trangThai === 1 ? 'Hoạt động' : 'Ngưng'" :severity="viewingCustomer.trangThai === 1 ? 'success' : 'danger'" />
                        </div>
                        <div><strong>ID Tài khoản:</strong> {{ viewingCustomer.idTaiKhoan || 'Chưa có' }}</div>
                        <div><strong>ID Ví điểm:</strong> {{ viewingCustomer.idViDiem || 'Chưa có' }}</div>
                        <div><strong>ID Địa chỉ:</strong> {{ viewingCustomer.idDiaChi || 'Chưa có' }}</div>
                        <div><strong>Ngày tạo:</strong> {{ formatDate(viewingCustomer.ngayTao) }}</div>
                        <div><strong>Cập nhật:</strong> {{ formatDate(viewingCustomer.ngayCapNhat) }}</div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Đóng" icon="pi pi-times" text @click="viewDialog = false" />
                <Button label="Sửa" icon="pi pi-pencil" @click="editFromView" />
            </template>
        </Dialog>

        <!-- Edit Customer Dialog -->
        <Dialog v-model:visible="customerDialog" :style="{ width: '600px' }" :header="`${customer.id ? 'Cập nhật' : 'Thêm'} khách hàng`" :modal="true">
            <div class="flex flex-col gap-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="hoTen" class="mb-3 block font-bold">Họ Tên *</label>
                        <InputText id="hoTen" v-model.trim="customer.hoTen" required="true" :invalid="submitted && !customer.hoTen" fluid />
                        <small v-if="submitted && !customer.hoTen" class="text-red-500">Họ tên là bắt buộc.</small>
                    </div>
                    <div>
                        <label for="maKhachHang" class="mb-3 block font-bold">Mã khách hàng</label>
                        <InputText id="maKhachHang" v-model="customer.maKhachHang" fluid />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="email" class="mb-3 block font-bold">Email *</label>
                        <InputText id="email" v-model="customer.email" required="true" :invalid="submitted && (!customer.email || !isValidEmail(customer.email))" fluid />
                        <small v-if="submitted && !customer.email" class="text-red-500">Email là bắt buộc.</small>
                        <small v-if="submitted && customer.email && !isValidEmail(customer.email)" class="text-red-500">Email không hợp lệ.</small>
                    </div>
                    <div>
                        <label for="sdt" class="mb-3 block font-bold">Số điện thoại *</label>
                        <InputText id="sdt" v-model="customer.sdt" required="true" :invalid="submitted && (!customer.sdt || !isValidPhone(customer.sdt))" fluid />
                        <small v-if="submitted && !customer.sdt" class="text-red-500">Số điện thoại là bắt buộc.</small>
                        <small v-if="submitted && customer.sdt && !isValidPhone(customer.sdt)" class="text-red-500">Số điện thoại không hợp lệ.</small>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label for="idTaiKhoan" class="mb-3 block font-bold">ID Tài khoản</label>
                        <InputNumber id="idTaiKhoan" v-model="customer.idTaiKhoan" :useGrouping="false" fluid />
                    </div>
                    <div>
                        <label for="idViDiem" class="mb-3 block font-bold">ID Ví điểm</label>
                        <InputNumber id="idViDiem" v-model="customer.idViDiem" :useGrouping="false" fluid />
                    </div>
                    <div>
                        <label for="idDiaChi" class="mb-3 block font-bold">ID Địa chỉ</label>
                        <InputNumber id="idDiaChi" v-model="customer.idDiaChi" :useGrouping="false" fluid />
                    </div>
                </div>

                <div>
                    <label for="trangThai" class="mb-3 block font-bold">Trạng thái *</label>
                    <Select id="trangThai" v-model="customer.trangThai" :options="statusOptionsForForm" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" :invalid="submitted && customer.trangThai === undefined" fluid />
                    <small v-if="submitted && customer.trangThai === undefined" class="text-red-500">Trạng thái là bắt buộc.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" :disabled="saving" />
                <Button :label="customer.id ? 'Cập nhật' : 'Thêm'" icon="pi pi-check" @click="saveCustomer" :loading="saving" />
            </template>
        </Dialog>

        <!-- Delete Dialogs -->
        <Dialog v-model:visible="deleteCustomerDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="customer"
                    >Bạn có chắc chắn muốn xóa khách hàng <b>{{ customer.hoTen }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteCustomerDialog = false" :disabled="deleting" />
                <Button label="Có" icon="pi pi-check" @click="deleteCustomer" :loading="deleting" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteCustomersDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Bạn có chắc chắn muốn xóa các khách hàng đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteCustomersDialog = false" :disabled="deleting" />
                <Button label="Có" icon="pi pi-check" @click="deleteSelectedCustomers" :loading="deleting" />
            </template>
        </Dialog>

        <Toast />
    </div>
    <!-- Dialog xem tất cả địa chỉ -->
<Dialog 
    v-model:visible="addressListDialog" 
    :style="{ width: '800px' }" 
    :header="`Danh sách địa chỉ - ${selectedCustomerAddresses?.hoTen || 'Khách hàng'}`" 
    :modal="true"
>
    <div v-if="selectedCustomerAddresses && selectedCustomerAddresses.danhSachDiaChi" class="flex flex-col gap-3">
        <div 
            v-for="(address, index) in selectedCustomerAddresses.danhSachDiaChi" 
            :key="address.id || index"
            class="border rounded-lg p-4"
            :class="address.isDefault ? 'border-primary bg-primary-50' : 'border-muted'"
        >
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="font-semibold">Địa chỉ #{{ index + 1 }}</span>
                    <Tag v-if="address.isDefault" value="Mặc định" severity="success" />
                    <Tag 
                        :value="address.trangThai === 1 ? 'Hoạt động' : 'Ngưng'" 
                        :severity="address.trangThai === 1 ? 'success' : 'danger'" 
                    />
                </div>
                <div class="flex gap-1">
                    <Button 
                        icon="pi pi-pencil" 
                        outlined 
                        size="small" 
                        @click="editAddress(address, selectedCustomerAddresses)" 
                        title="Sửa địa chỉ" 
                    />
                    <Button 
                        icon="pi pi-trash" 
                        outlined 
                        severity="danger" 
                        size="small" 
                        @click="deleteAddress(address)" 
                        title="Xóa địa chỉ" 
                    />
                </div>
            </div>
            
            <div class="text-sm text-muted">
                <i class="pi pi-map-marker mr-2"></i>
                {{ address.diaChiDayDu || formatAddressFromInfo(address) }}
            </div>
            
            <!-- Chi tiết địa chỉ -->
            <div class="grid grid-cols-2 gap-2 mt-3 text-xs text-muted">
                <div v-if="address.tenTinh"><strong>Tỉnh/TP:</strong> {{ address.tenTinh }}</div>
                <div v-if="address.tenHuyen"><strong>Quận/Huyện:</strong> {{ address.tenHuyen }}</div>
                <div v-if="address.tenPhuong"><strong>Phường/Xã:</strong> {{ address.tenPhuong }}</div>
                <div v-if="address.diaChiChiTiet"><strong>Chi tiết:</strong> {{ address.diaChiChiTiet }}</div>
            </div>
        </div>
        
        <!-- Trường hợp không có địa chỉ -->
        <div v-if="selectedCustomerAddresses.danhSachDiaChi.length === 0" class="text-center py-4">
            <i class="pi pi-map-marker text-muted text-3xl mb-2"></i>
            <p class="text-muted">Khách hàng chưa có địa chỉ nào</p>
        </div>
    </div>
    
    <template #footer>
        <Button label="Đóng" icon="pi pi-times" text @click="addressListDialog = false" />
        <Button label="Thêm địa chỉ mới" icon="pi pi-plus" @click="addNewAddress" />
    </template>
</Dialog>
</template>

<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const dt = ref();
const customers = ref([]);
const customerDialog = ref(false);
const viewDialog = ref(false);
const deleteCustomerDialog = ref(false);
const deleteCustomersDialog = ref(false);
const customer = ref({});
const viewingCustomer = ref(null);
const selectedCustomers = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const statusFilter = ref('');
const submitted = ref(false);
const isLoading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const exporting = ref(false);

const statusOptions = ref([
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngưng hoạt động', value: 0 }
]);

const statusOptionsForForm = ref([
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngưng hoạt động', value: 0 }
]);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);

onMounted(() => {
    console.log('🚀 Component mounted, calling fetchData...');
    fetchData();
});

async function fetchData() {
    isLoading.value = true;
    console.log('🔄 Bắt đầu fetch data từ:', 'http://localhost:8080/api/khach-hang');

    try {
        console.log('📡 Đang gọi API...');
        const res = await axios.get('http://localhost:8080/api/khach-hang', { timeout: 10000 });

        console.log('✅ Response status:', res.status);
        console.log('📦 Response headers:', res.headers);
        console.log('📄 Response data type:', typeof res.data);
        console.log('📄 Response data length:', Array.isArray(res.data) ? res.data.length : 'Not array');
        console.log('📄 Full response data:', res.data);

        if (res.data) {
            // Kiểm tra structure của response
            if (Array.isArray(res.data)) {
                console.log('✅ Data là array với', res.data.length, 'items');
                customers.value = res.data;
                if (res.data.length > 0) {
                    console.log('📋 Sample item:', res.data[0]);
                    console.log('📋 Item keys:', Object.keys(res.data[0]));
                }
            } else if (res.data.content && Array.isArray(res.data.content)) {
                console.log('✅ Data có pagination với', res.data.content.length, 'items');
                console.log('📋 Pagination info:', {
                    totalElements: res.data.totalElements,
                    totalPages: res.data.totalPages,
                    currentPage: res.data.currentPage
                });
                customers.value = res.data.content; // Fix: Set customers.value here
                if (res.data.content.length > 0) {
                    console.log('📋 Sample item:', res.data.content[0]);
                    console.log('📋 Item keys:', Object.keys(res.data.content[0]));
                }
            } else {
                console.log('❓ Data structure không như mong đợi:', res.data);
                customers.value = []; // Set empty array instead of undefined
            }
        } else {
            customers.value = [];
        }
        console.log('💾 customers.value đã set:', customers.value.length, 'items');
    } catch (error) {
        console.error('❌ Error details:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                timeout: error.config?.timeout
            }
        });

        // Kiểm tra loại lỗi cụ thể
        if (error.code === 'ECONNREFUSED') {
            console.error('🔌 Server không khả dụng - kiểm tra backend có chạy không');
            toast.add({
                severity: 'error',
                summary: 'Lỗi kết nối',
                detail: 'Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy.',
                life: 5000
            });
        } else if (error.code === 'TIMEOUT') {
            console.error('⏱️ Request timeout');
            toast.add({
                severity: 'error',
                summary: 'Timeout',
                detail: 'Request mất quá nhiều thời gian. Vui lòng thử lại.',
                life: 5000
            });
        } else if (error.response?.status === 404) {
            console.error('🔍 API endpoint không tồn tại');
            toast.add({
                severity: 'error',
                summary: 'API không tìm thấy',
                detail: 'Endpoint /khach-hang không tồn tại. Kiểm tra controller.',
                life: 5000
            });
        } else if (error.response?.status === 500) {
            console.error('💥 Server internal error');
            toast.add({
                severity: 'error',
                summary: 'Lỗi server',
                detail: 'Server gặp lỗi nội bộ. Kiểm tra logs backend.',
                life: 5000
            });
        } else {
            console.error('❓ Lỗi không xác định');
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: `Có lỗi xảy ra: ${error.message}`,
                life: 3000
            });
        }

        customers.value = [];
    } finally {
        isLoading.value = false;
        console.log('🏁 fetchData completed. Final customers count:', customers.value.length);
    }
}

const filteredCustomers = computed(() => {
    console.log('🔍 Computing filteredCustomers...');
    console.log('📊 customers.value:', customers.value.length, 'items');
    console.log('🏷️ statusFilter.value:', statusFilter.value);

    let filtered = customers.value;
    if (statusFilter.value !== '') {
        const statusValue = parseInt(statusFilter.value);
        console.log('🔽 Filtering by status:', statusValue);
        filtered = filtered.filter((cust) => {
            const custStatus = cust.trangThai;
            console.log(`Customer ${cust.id}: status ${custStatus} === ${statusValue} ?`, custStatus === statusValue);
            return custStatus === statusValue;
        });
        console.log('📊 After status filter:', filtered.length, 'items');
    }

    console.log('✅ Final filtered result:', filtered.length, 'items');
    return filtered;
});

function viewCustomer(cust) {
    viewingCustomer.value = { ...cust };
    viewDialog.value = true;
}

function editFromView() {
    customer.value = {
        id: viewingCustomer.value.id,
        maKhachHang: viewingCustomer.value.maKhachHang,
        hoTen: viewingCustomer.value.hoTen,
        email: viewingCustomer.value.email,
        sdt: viewingCustomer.value.sdt,
        trangThai: viewingCustomer.value.trangThai,
        idTaiKhoan: viewingCustomer.value.idTaiKhoan,
        idViDiem: viewingCustomer.value.idViDiem,
        idDiaChi: viewingCustomer.value.idDiaChi
    };
    viewDialog.value = false;
    customerDialog.value = true;
}

function editCustomer(cust) {
    customer.value = {
        id: cust.id,
        maKhachHang: cust.maKhachHang,
        hoTen: cust.hoTen,
        email: cust.email,
        sdt: cust.sdt,
        trangThai: cust.trangThai,
        idTaiKhoan: cust.idTaiKhoan,
        idViDiem: cust.idViDiem,
        idDiaChi: cust.idDiaChi
    };
    customerDialog.value = true;
}

function openNew() {
    customer.value = {
        hoTen: '',
        maKhachHang: '',
        email: '',
        sdt: '',
        trangThai: 1,
        idTaiKhoan: null,
        idViDiem: null,
        idDiaChi: null
    };
    submitted.value = false;
    customerDialog.value = true;
}

function hideDialog() {
    customerDialog.value = false;
    submitted.value = false;
    customer.value = {};
}

async function saveCustomer() {
    submitted.value = true;
    saving.value = true;

    if (!customer.value.hoTen?.trim() || !customer.value.email?.trim() || !isValidEmail(customer.value.email) || !customer.value.sdt?.trim() || !isValidPhone(customer.value.sdt) || customer.value.trangThai === undefined) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng điền đầy đủ và đúng định dạng thông tin bắt buộc', life: 3000 });
        saving.value = false;
        return;
    }

    try {
        // Tạo DTO phù hợp với controller
        const customerDto = {
            id: customer.value.id || null,
            maKhachHang: customer.value.maKhachHang,
            hoTen: customer.value.hoTen.trim(),
            email: customer.value.email.trim(),
            sdt: customer.value.sdt.trim(),
            trangThai: customer.value.trangThai,
            idTaiKhoan: customer.value.idTaiKhoan || null,
            idViDiem: customer.value.idViDiem || null,
            idDiaChi: customer.value.idDiaChi || null
        };

        if (customer.value.id) {
            // Cập nhật khách hàng
            await axios.put(`http://localhost:8080/api/khach-hang/${customer.value.id}`, customerDto, { timeout: 5000 });
            toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật khách hàng thành công', life: 3000 });
        } else {
            // Thêm khách hàng mới
            await axios.post('http://localhost:8080/api/khach-hang', customerDto, { timeout: 5000 });
            toast.add({ severity: 'success', summary: 'Thành công', detail: 'Thêm khách hàng thành công', life: 3000 });
        }

        await fetchData();
        hideDialog();
    } catch (error) {
        console.error('Error saving customer:', error);
        const errorMessage = error.response?.data || error.message || 'Có lỗi xảy ra';
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: typeof errorMessage === 'string' ? errorMessage : 'Lưu khách hàng thất bại',
            life: 5000
        });
    } finally {
        saving.value = false;
    }
}

function confirmDeleteCustomer(cust) {
    customer.value = cust;
    deleteCustomerDialog.value = true;
}

async function deleteCustomer() {
    deleting.value = true;
    try {
        await axios.delete(`http://localhost:8080/api/khach-hang/${customer.value.id}`, { timeout: 5000 });
        await fetchData();
        deleteCustomerDialog.value = false;
        customer.value = {};
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa khách hàng thành công', life: 3000 });
    } catch (error) {
        console.error('Error deleting customer:', error);
        const errorMessage = error.response?.data || error.message || 'Xóa khách hàng thất bại';
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: typeof errorMessage === 'string' ? errorMessage : 'Xóa khách hàng thất bại',
            life: 3000
        });
    } finally {
        deleting.value = false;
    }
}

async function changeStatus(cust) {
    try {
        const newStatus = cust.trangThai === 1 ? 0 : 1;
        const updateData = {
            id: cust.id,
            maKhachHang: cust.maKhachHang,
            hoTen: cust.hoTen,
            email: cust.email,
            sdt: cust.sdt,
            trangThai: newStatus,
            idTaiKhoan: cust.idTaiKhoan,
            idViDiem: cust.idViDiem,
            idDiaChi: cust.idDiaChi
        };

        await axios.put(`http://localhost:8080/api/khach-hang/${cust.id}`, updateData, { timeout: 5000 });
        await fetchData();
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã ${newStatus === 1 ? 'kích hoạt' : 'ngưng'} khách hàng`,
            life: 3000
        });
    } catch (error) {
        console.error('Error changing status:', error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Thay đổi trạng thái thất bại', life: 3000 });
    }
}

function confirmDeleteSelected() {
    deleteCustomersDialog.value = true;
}

async function deleteSelectedCustomers() {
    deleting.value = true;
    try {
        for (const cust of selectedCustomers.value) {
            await axios.delete(`http://localhost:8080/api/khach-hang/${cust.id}`, { timeout: 5000 });
        }
        await fetchData();
        deleteCustomersDialog.value = false;
        selectedCustomers.value = null;
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa các khách hàng thành công', life: 3000 });
    } catch (error) {
        console.error('Error deleting customers:', error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Xóa khách hàng thất bại', life: 3000 });
    } finally {
        deleting.value = false;
    }
}

async function exportCSV() {
    exporting.value = true;
    try {
        if (!customers.value.length) {
            toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Không có dữ liệu để xuất', life: 3000 });
            return;
        }

        const headers = ['ID', 'Mã Khách Hàng', 'Họ Tên', 'Email', 'SĐT', 'ID Tài khoản', 'ID Ví điểm', 'ID Địa chỉ', 'Trạng Thái', 'Ngày Tạo'];
        const csvData = customers.value.map((item) => [
            item.id || '',
            item.maKhachHang || '',
            item.hoTen || '',
            item.email || '',
            item.sdt || '',
            item.idTaiKhoan || '',
            item.idViDiem || '',
            item.idDiaChi || '',
            item.trangThai === 1 ? 'Hoạt động' : 'Ngừng hoạt động',
            formatDate(item.ngayTao)
        ]);

        const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `KhachHang-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.add({ severity: 'success', summary: 'Thành công', detail: `Đã xuất ${customers.value.length} bản ghi`, life: 3000 });
    } catch (error) {
        console.error('Error exporting CSV:', error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Xuất CSV thất bại', life: 3000 });
    } finally {
        exporting.value = false;
    }
}

function goToAccountManagement() {
    router.push('/tai-khoan');
}

function formatDate(date) {
    return date ? new Date(date).toLocaleDateString('vi-VN') : '';
}

function getInitials(name) {
    return name
        ? name
              .split(' ')
              .map((word) => word.charAt(0))
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : '';
}
// Thêm các hàm này vào script setup

// Format địa chỉ từ DiaChiInfo object
function formatAddressFromInfo(diaChiInfo) {
    if (!diaChiInfo) return 'Chưa có địa chỉ';
    
    const parts = [];
    
    // Địa chỉ chi tiết
    if (diaChiInfo.diaChiChiTiet) {
        parts.push(diaChiInfo.diaChiChiTiet);
    }
    
    // Phường/Xã
    if (diaChiInfo.tenPhuong) {
        parts.push(diaChiInfo.tenPhuong);
    }
    
    // Quận/Huyện  
    if (diaChiInfo.tenHuyen) {
        parts.push(diaChiInfo.tenHuyen);
    }
    
    // Tỉnh/Thành phố
    if (diaChiInfo.tenTinh) {
        parts.push(diaChiInfo.tenTinh);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Chưa có địa chỉ';
}

// Dialog để xem tất cả địa chỉ
const addressListDialog = ref(false);
const selectedCustomerAddresses = ref(null);

function viewAllAddresses(customer) {
    selectedCustomerAddresses.value = customer;
    addressListDialog.value = true;
}
function editAddress(address, customer) {
    // Logic để mở form sửa địa chỉ
    console.log('Edit address:', address, 'for customer:', customer);
    toast.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Chức năng sửa địa chỉ sẽ được triển khai',
        life: 3000
    });
}

// Xóa địa chỉ
function deleteAddress(address) {
    // Logic để xóa địa chỉ
    console.log('Delete address:', address);
    toast.add({
        severity: 'info',
        summary: 'Thông báo', 
        detail: 'Chức năng xóa địa chỉ sẽ được triển khai',
        life: 3000
    });
}

// Thêm địa chỉ mới
function addNewAddress() {
    if (!selectedCustomerAddresses.value) return;
    
    console.log('Add new address for customer:', selectedCustomerAddresses.value);
    toast.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Chức năng thêm địa chỉ mới sẽ được triển khai', 
        life: 3000
    });
}
</script>

<style scoped>
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>
