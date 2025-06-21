function cancelEditAddress() {
    addressDialog.value = false;
    editingAddress.value = {};
    editingCustomer.value = {};
}<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Thêm mới" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                <Button label="Xóa" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedCustomers || !selectedCustomers.length" />
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
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
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Quản Lý Khách Hàng</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Tìm kiếm..." />
                    </IconField>
                    <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Lọc trạng thái" class="w-12rem" />
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="ID" sortable style="width: 8rem">
                <template #body="slotProps">
                    <span class="font-bold text-primary">#{{ slotProps.data.id }}</span>
                </template>
            </Column>
            <Column field="maKhachHang" header="Mã KH" sortable style="width: 10rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.maKhachHang" severity="secondary" />
                </template>
            </Column>
            <Column field="hoTen" header="Thông tin" sortable style="min-width: 16rem">
                <template #body="slotProps">
                    <div class="flex items-center">
                        <span class="rounded-circle w-2rem h-2rem flex items-center justify-center text-white font-bold mr-2" :style="{ background: 'linear-gradient(45deg, #007bff, #6f42c1)' }">
                            {{ getInitials(slotProps.data.hoTen) }}
                        </span>
                        <span class="font-semibold">{{ slotProps.data.hoTen }}</span>
                    </div>
                </template>
            </Column>
            <!-- Cột địa chỉ -->
            <Column header="Địa chỉ" style="min-width: 18rem">
                <template #body="slotProps">
                    <div class="flex flex-col">
                        <span class="text-sm text-muted">
                            <i class="pi pi-map-marker mr-1 text-muted"></i>
                            {{ formatFullAddress(slotProps.data.diaChiInfo) }}
                        </span>
                    </div>
                </template>
            </Column>
            <Column header="Liên hệ" style="min-width: 16rem">
                <template #body="slotProps">
                    <div class="flex flex-col">
                        <span class="mb-1">
                            <i class="pi pi-envelope mr-1 text-muted"></i>
                            {{ slotProps.data.email }}
                        </span>
                        <span>
                            <i class="pi pi-phone mr-1 text-muted"></i>
                            {{ slotProps.data.sdt }}
                        </span>
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
            <Column :exportable="false" style="width: 12rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editCustomer(slotProps.data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteCustomer(slotProps.data)" />
                    <Button icon="pi pi-refresh" outlined rounded severity="secondary" class="ml-2" @click="changeStatus(slotProps.data)" :title="slotProps.data.trangThai === 1 ? 'Ngưng hoạt động' : 'Kích hoạt'" />
                </template>
            </Column>
            <template #empty>
                <div class="text-center p-5">
                    <i class="pi pi-users text-5xl text-muted mb-3"></i>
                    <h5 class="text-muted">Không tìm thấy khách hàng</h5>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm khách hàng mới.</p>
                </div>
            </template>
        </DataTable>

        <!-- Add/Edit Customer Dialog -->
        <Dialog v-model:visible="customerDialog" :style="{ width: '700px' }" :header="customer.id ? 'Cập nhật khách hàng' : 'Thêm khách hàng'" :modal="true">
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="hoTen" class="block font-bold mb-3">Họ Tên</label>
                        <InputText id="hoTen" v-model.trim="customer.hoTen" required="true" autofocus :invalid="submitted && !customer.hoTen" fluid />
                        <small v-if="submitted && !customer.hoTen" class="text-red-500">Họ tên là bắt buộc.</small>
                    </div>
                    <div>
                        <label for="maKhachHang" class="block font-bold mb-3">Mã khách hàng</label>
                        <InputText id="maKhachHang" v-model="customer.maKhachHang" fluid />
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="email" class="block font-bold mb-3">Email</label>
                        <InputText id="email" v-model="customer.email" fluid />
                    </div>
                    <div>
                        <label for="sdt" class="block font-bold mb-3">Số điện thoại</label>
                        <InputText id="sdt" v-model="customer.sdt" fluid />
                    </div>
                </div>
                
                <!-- Phần địa chỉ -->
                <div class="border-top pt-4">
                    <div class="flex justify-between items-center mb-3">
                        <h5 class="mb-0">Thông tin địa chỉ</h5>
                        <Button 
                            v-if="customer.diaChi" 
                            label="Chọn địa chỉ khác" 
                            icon="pi pi-search" 
                            size="small" 
                            outlined 
                            @click="showAddressSelector = true"
                        />
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label for="tenKhachHang" class="block font-bold mb-3">Tên khách hàng (trong địa chỉ)</label>
                            <InputText id="tenKhachHang" v-model="customer.newAddress.tenKhachHang" placeholder="Tên khách hàng..." fluid />
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label for="tenPhuong" class="block font-bold mb-3">Tên Phường</label>
                                <InputText id="tenPhuong" v-model="customer.newAddress.tenPhuong" placeholder="Tên phường" fluid />
                            </div>
                            <div>
                                <label for="tenHuyen" class="block font-bold mb-3">Tên Huyện</label>
                                <InputText id="tenHuyen" v-model="customer.newAddress.tenHuyen" placeholder="Tên huyện" fluid />
                            </div>
                            <div>
                                <label for="tenTinh" class="block font-bold mb-3">Tên Tỉnh</label>
                                <InputText id="tenTinh" v-model="customer.newAddress.tenTinh" placeholder="Tên tỉnh" fluid />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <label for="trangThai" class="block font-bold mb-3">Trạng thái</label>
                    <Select id="trangThai" v-model="customer.trangThai" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Lưu" icon="pi pi-check" @click="saveCustomer" />
            </template>
        </Dialog>

        <!-- Address Selector Dialog -->
        <Dialog v-model:visible="showAddressSelector" :style="{ width: '800px' }" header="Chọn địa chỉ" :modal="true">
            <div class="mb-4">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="addressSearchKeyword" placeholder="Tìm kiếm địa chỉ..." fluid @input="searchAddresses" />
                </IconField>
            </div>
            <DataTable :value="addresses" dataKey="id" :paginator="true" :rows="5" selectionMode="single" @row-select="selectAddress">
                <Column field="id" header="ID" style="width: 5rem"></Column>
                <Column field="tenKhachHang" header="Tên khách hàng"></Column>
                <Column header="Khu vực">
                    <template #body="slotProps">
                        {{ formatFullAddress(slotProps.data) }}
                    </template>
                </Column>
            </DataTable>
            <template #footer>
                <Button label="Đóng" icon="pi pi-times" text @click="showAddressSelector = false" />
            </template>
        </Dialog>

        <!-- Edit Address Dialog -->
        <Dialog v-model:visible="addressDialog" :style="{ width: '600px' }" :header="`Cập nhật địa chỉ - ${editingCustomer.hoTen || 'Khách hàng'}`" :modal="true">
            <div class="flex flex-col gap-4">
                <!-- Hiển thị thông tin khách hàng -->
                <div class="bg-gray-50 p-3 rounded-lg">
                    <h6 class="font-semibold text-gray-700 mb-2">Thông tin khách hàng:</h6>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <span><strong>Tên:</strong> {{ editingCustomer.hoTen }}</span>
                        <span><strong>Email:</strong> {{ editingCustomer.email }}</span>
                        <span><strong>SĐT:</strong> {{ editingCustomer.sdt }}</span>
                        <span><strong>Mã KH:</strong> {{ editingCustomer.maKhachHang }}</span>
                    </div>
                </div>

                <!-- Form chỉnh sửa địa chỉ -->
                <div>
                    <label for="editTenKhachHang" class="block font-bold mb-3">Tên khách hàng (trong địa chỉ)</label>
                    <InputText 
                        id="editTenKhachHang" 
                        v-model="editingAddress.tenKhachHang" 
                        placeholder="Tên khách hàng..." 
                        fluid 
                        :invalid="!editingAddress.tenKhachHang"
                    />
                    <small v-if="!editingAddress.tenKhachHang" class="text-red-500">Tên khách hàng là bắt buộc</small>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label for="editTenPhuong" class="block font-bold mb-3">Tên Phường</label>
                        <InputText 
                            id="editTenPhuong" 
                            v-model="editingAddress.tenPhuong" 
                            placeholder="Tên phường" 
                            fluid 
                            :invalid="!editingAddress.tenPhuong"
                        />
                        <small v-if="!editingAddress.tenPhuong" class="text-red-500">Tên phường là bắt buộc</small>
                    </div>
                    <div>
                        <label for="editTenHuyen" class="block font-bold mb-3">Tên Huyện</label>
                        <InputText 
                            id="editTenHuyen" 
                            v-model="editingAddress.tenHuyen" 
                            placeholder="Tên huyện" 
                            fluid 
                            :invalid="!editingAddress.tenHuyen"
                        />
                        <small v-if="!editingAddress.tenHuyen" class="text-red-500">Tên huyện là bắt buộc</small>
                    </div>
                    <div>
                        <label for="editTenTinh" class="block font-bold mb-3">Tên Tỉnh</label>
                        <InputText 
                            id="editTenTinh" 
                            v-model="editingAddress.tenTinh" 
                            placeholder="Tên tỉnh" 
                            fluid 
                            :invalid="!editingAddress.tenTinh"
                        />
                        <small v-if="!editingAddress.tenTinh" class="text-red-500">Tên tỉnh là bắt buộc</small>
                    </div>
                </div>

                <!-- Preview địa chỉ -->
                <div class="bg-blue-50 p-3 rounded-lg">
                    <h6 class="font-semibold text-blue-700 mb-2">Xem trước địa chỉ:</h6>
                    <div class="text-sm text-blue-600">
                        <div><strong>{{ editingAddress.tenKhachHang || 'Tên khách hàng' }}</strong></div>
                        <div>{{ formatFullAddress(editingAddress) }}</div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="cancelEditAddress" />
                <Button 
                    label="Cập nhật" 
                    icon="pi pi-check" 
                    @click="updateAddress"
                    :disabled="!editingAddress.tenKhachHang || !editingAddress.tenPhuong || !editingAddress.tenHuyen || !editingAddress.tenTinh"
                />
            </template>
        </Dialog>

        <!-- Delete Customer Dialog -->
        <Dialog v-model:visible="deleteCustomerDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="customer">Bạn có chắc chắn muốn xóa <b>{{ customer.hoTen }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteCustomerDialog = false" />
                <Button label="Có" icon="pi pi-check" @click="deleteCustomer" />
            </template>
        </Dialog>

        <!-- Delete Selected Customers Dialog -->
        <Dialog v-model:visible="deleteCustomersDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Bạn có chắc chắn muốn xóa các khách hàng đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteCustomersDialog = false" />
                <Button label="Có" icon="pi pi-check" text @click="deleteSelectedCustomers" />
            </template>
        </Dialog>

        <!-- Toast Notifications -->
        <Toast />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';
import ListDoc from '@/views/uikit/ListDoc.vue';

const toast = useToast();
const dt = ref();
const customers = ref([]);
const addresses = ref([]);
const customerDialog = ref(false);
const addressDialog = ref(false);
const showAddressSelector = ref(false);
const deleteCustomerDialog = ref(false);
const deleteCustomersDialog = ref(false);
const customer = ref({});
const editingAddress = ref({});
const editingCustomer = ref({});
const selectedCustomers = ref();
const addressSearchKeyword = ref('');
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const statusFilter = ref('');
const submitted = ref(false);
const isLoading = ref(false);
const statusOptions = ref([
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngưng hoạt động', value: 0 }
]);

onMounted(() => {
    fetchData();
    fetchAddresses();
});

async function fetchData() {
    isLoading.value = true;
    try {
        const res = await axios.get('http://localhost:8080/khach-hang');
        const customersData = res.data;
        
        // Fetch địa chỉ cho mỗi khách hàng
        for (let customer of customersData) {
            if (customer.diaChi) {
                try {
                    const addressRes = await axios.get(`http://localhost:8080/api/dia-chi/${customer.diaChi}`);
                    customer.diaChiInfo = addressRes.data;
                } catch (error) {
                    console.error(`Error fetching address for customer ${customer.id}:`, error);
                    customer.diaChiInfo = null;
                }
            }
        }
        
        customers.value = customersData;
        
    } catch (error) {
        console.error('Error fetching data:', error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi tải dữ liệu khách hàng', life: 3000 });
    } finally {
        isLoading.value = false;
    }
}

async function fetchAddresses() {
    try {
        const res = await axios.get('http://localhost:8080/api/dia-chi');
        addresses.value = res.data;
    } catch (error) {
        console.error('Error fetching addresses:', error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi tải danh sách địa chỉ', life: 3000 });
    }
}

async function searchAddresses() {
    if (addressSearchKeyword.value.trim()) {
        try {
            const res = await axios.get(`http://localhost:8080/api/dia-chi/search?keyword=${encodeURIComponent(addressSearchKeyword.value)}`);
            addresses.value = res.data;
        } catch (error) {
            console.error('Error searching addresses:', error);
        }
    } else {
        fetchAddresses();
    }
}

const filteredCustomers = computed(() => {
    let filtered = customers.value;

    if (statusFilter.value !== '') {
        filtered = filtered.filter((kh) => kh.trangThai === parseInt(statusFilter.value));
    }

    return filtered;
});

function openNew() {
    customer.value = { 
        trangThai: 1,
        newAddress: {
            tenKhachHang: '',
            tenTinh: '',
            tenHuyen: '',
            tenPhuong: ''
        }
    };
    submitted.value = false;
    customerDialog.value = true;
}

function hideDialog() {
    customerDialog.value = false;
    submitted.value = false;
}

// Hàm format địa chỉ đầy đủ theo DTO structure
function formatFullAddress(diaChiInfo) {
    if (!diaChiInfo) return 'Chưa cập nhật địa chỉ';
    
    const parts = [
        diaChiInfo.tenPhuong,
        diaChiInfo.tenHuyen, 
        diaChiInfo.tenTinh
    ].filter(part => part && part.trim() !== '');
    
    return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật thông tin';
}

async function saveCustomer() {
    submitted.value = true;

    if (customer.value.hoTen?.trim()) {
        try {
            let addressId = customer.value.diaChi;
            
            // Nếu có thông tin địa chỉ mới, tạo hoặc cập nhật địa chỉ
            if (customer.value.newAddress && (
                customer.value.newAddress.tenKhachHang || 
                customer.value.newAddress.tenTinh || 
                customer.value.newAddress.tenHuyen || 
                customer.value.newAddress.tenPhuong
            )) {
                if (addressId) {
                    // Cập nhật địa chỉ hiện có
                    await axios.put(`http://localhost:8080/api/dia-chi/${addressId}`, customer.value.newAddress);
                } else {
                    // Tạo địa chỉ mới
                    const addressRes = await axios.post('http://localhost:8080/api/dia-chi', customer.value.newAddress);
                    addressId = addressRes.data.id;
                }
            }

            // Chuẩn bị dữ liệu khách hàng theo DTO structure
            const customerData = {
                id: customer.value.id,
                maKhachHang: customer.value.maKhachHang || createId(),
                email: customer.value.email,
                hoTen: customer.value.hoTen,
                sdt: customer.value.sdt,
                trangThai: customer.value.trangThai,
                diaChi: addressId, // Chỉ gửi ID
                viDiem: customer.value.viDiem || 1, // Default value
                taiKhoan: customer.value.taiKhoan || 1 // Default value
            };

            if (customer.value.id) {
                await axios.put(`http://localhost:8080/khach-hang/${customer.value.id}`, customerData);
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Cập nhật khách hàng thành công',
                    life: 3000
                });
            } else {
                await axios.post('http://localhost:8080/khach-hang', customerData);
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Thêm khách hàng thành công',
                    life: 3000
                });
            }
            
            await fetchData();
            await fetchAddresses();
            customerDialog.value = false;
            customer.value = {};
        } catch (error) {
            console.error('Error saving customer:', error);
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Có lỗi xảy ra khi lưu khách hàng',
                life: 3000
            });
        }
    }
}

function editCustomer(cust) {
    customer.value = { 
        ...cust,
        newAddress: cust.diaChiInfo ? { ...cust.diaChiInfo } : {
            tenKhachHang: '',
            tenTinh: '',
            tenHuyen: '',
            tenPhuong: ''
        }
    };
    customerDialog.value = true;
}

function editAddress(address, customerData) {
    editingAddress.value = { ...address };
    editingCustomer.value = customerData;
    addressDialog.value = true;
    console.log('Editing address:', address);
    console.log('For customer:', customerData);
}

async function updateAddress() {
    try {
        console.log('Updating address with data:', editingAddress.value);
        
        const updatedAddress = await axios.put(`http://localhost:8080/api/dia-chi/${editingAddress.value.id}`, editingAddress.value);
        
        console.log('Address updated successfully:', updatedAddress.data);
        
        // Refresh dữ liệu khách hàng để hiển thị địa chỉ mới
        await fetchData();
        await fetchAddresses();
        
        addressDialog.value = false;
        
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Cập nhật địa chỉ cho ${editingCustomer.value.hoTen} thành công`,
            life: 3000
        });
        
        // Reset editing data
        editingAddress.value = {};
        editingCustomer.value = {};
        
    } catch (error) {
        console.error('Error updating address:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi cập nhật địa chỉ: ' + (error.response?.data?.message || error.message),
            life: 5000
        });
    }
}

function selectAddress(event) {
    customer.value.diaChi = event.data.id;
    customer.value.newAddress = { ...event.data };
    showAddressSelector.value = false;
}

function confirmDeleteCustomer(cust) {
    customer.value = cust;
    deleteCustomerDialog.value = true;
}

async function deleteCustomer() {
    try {
        await axios.delete(`http://localhost:8080/khach-hang/${customer.value.id}`);
        await fetchData();
        deleteCustomerDialog.value = false;
        customer.value = {};
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa khách hàng thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi xóa khách hàng',
            life: 3000
        });
    }
}

async function changeStatus(cust) {
    try {
        const newStatus = cust.trangThai === 1 ? 0 : 1;
        await axios.put(`http://localhost:8080/khach-hang/${cust.id}`, {
            ...cust,
            trangThai: newStatus
        });
        await fetchData();
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã ${newStatus === 1 ? 'kích hoạt' : 'ngưng'} khách hàng`,
            life: 3000
        });
    } catch (error) {
        console.error('Error changing status:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi thay đổi trạng thái',
            life: 3000
        });
    }
}

function confirmDeleteSelected() {
    deleteCustomersDialog.value = true;
}

async function deleteSelectedCustomers() {
    try {
        for (const cust of selectedCustomers.value) {
            await axios.delete(`http://localhost:8080/khach-hang/${cust.id}`);
        }
        await fetchData();
        deleteCustomersDialog.value = false;
        selectedCustomers.value = null;
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các khách hàng thành công',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting customers:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi xóa khách hàng',
            life: 3000
        });
    }
}

// function exportCSV() {
//     dt.value.exportCSV();
// }
function exportCSV() {
    try {
        // If no data, show warning
        if (!customers.value || customers.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không có dữ liệu để xuất',
                life: 3000
            });
            return;
        }

        // Create CSV headers with Vietnamese labels
        const headers = ['ID', 'Mã Khách Hàng', 'Tên Khách Hàng', 'Email', 'Số Điện Thoại', 'Trạng Thái'];

        // Convert data to CSV format
        const csvData = customers.value.map(item => {
            return [
                item.id || '',
                item.maKhachHang || '',
                item.hoTen || '',
                item.email || '',
                item.sdt || '',
                item.trangThai === 1 ? 'Hoạt động' : 'Ngừng hoạt động'
            ];
        });

        // Combine headers and data
        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => {
                // Handle fields that might contain commas or quotes
                const stringField = String(field);
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            }).join(','))
            .join('\n');

        // Add BOM for proper UTF-8 encoding in Excel
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;

        // Create and download file
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            // Generate filename with current date
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
            const filename = `KhachHang-${dateStr}.csv`;

            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xuất ${customers.value.length} bản ghi ra file CSV`,
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error exporting CSV:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xuất CSV thất bại',
            life: 3000
        });
    }
}

function createId() {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function getInitials(name) {
    return name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
</script>

<style scoped>
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>