<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Thêm tài khoản" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                <Button label="Xóa đã chọn" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedAccounts || !selectedAccounts.length" />
            </template>
            <template #end>
                <Button label="Xuất CSV" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
            </template>
        </Toolbar>

        <!-- DataTable -->
        <DataTable
            ref="dt"
            v-model:selection="selectedAccounts"
            :value="filteredAccounts"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} tài khoản"
            :loading="isLoading"
        >
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <h4 class="m-0">Quản Lý Tài Khoản</h4>
                    <div class="flex gap-2">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Tìm kiếm..." />
                        </IconField>
                        <Select v-model="roleFilter" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="Lọc vai trò" class="w-12rem" />
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
            <Column field="maTaiKhoan" header="Mã TK" sortable style="width: 10rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.maTaiKhoan" severity="info" />
                </template>
            </Column>
            <Column field="email" header="Email" sortable style="min-width: 16rem">
                <template #body="slotProps">
                    <div class="flex items-center">
                        <i class="pi pi-envelope text-muted mr-2"></i>
                        <span>{{ slotProps.data.email }}</span>
                    </div>
                </template>
            </Column>
            <Column field="vaiTro" header="Vai trò" sortable style="width: 12rem">
                <template #body="slotProps">
                    <Tag :value="getRoleLabel(slotProps.data.vaiTro)" :severity="getRoleSeverity(slotProps.data.vaiTro)">
                        <i :class="getRoleIcon(slotProps.data.vaiTro)" class="mr-1"></i>
                        {{ getRoleLabel(slotProps.data.vaiTro) }}
                    </Tag>
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
            <Column :exportable="false" style="width: 14rem">
                <template #body="slotProps">
                    <div class="flex gap-1">
                        <Button icon="pi pi-eye" outlined size="small" @click="viewAccount(slotProps.data)" title="Xem chi tiết" />
                        <Button icon="pi pi-pencil" outlined size="small" @click="editAccount(slotProps.data)" title="Sửa" />
                        <Button icon="pi pi-trash" outlined severity="danger" size="small" @click="confirmDeleteAccount(slotProps.data)" title="Xóa" />
                        <Button icon="pi pi-refresh" outlined severity="secondary" size="small" @click="changeStatus(slotProps.data)" :title="slotProps.data.trangThai === 1 ? 'Ngưng hoạt động' : 'Kích hoạt'" />
                    </div>
                </template>
            </Column>
            <template #empty>
                <div class="p-5 text-center">
                    <i class="pi pi-users text-muted mb-3 text-5xl"></i>
                    <h5 class="text-muted">Không tìm thấy tài khoản</h5>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm tài khoản mới.</p>
                </div>
            </template>
        </DataTable>

        <!-- Add Account Dialog -->
        <Dialog v-model:visible="addDialog" :style="{ width: '900px' }" header="Thêm tài khoản mới" :modal="true">
            <div class="flex flex-col gap-6">
                <!-- Thông tin tài khoản -->
                <div class="border-bottom pb-4">
                    <h5 class="mb-3">Thông tin đăng nhập</h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="maTaiKhoan" class="mb-3 block font-bold">Mã tài khoản</label>
                            <InputText id="maTaiKhoan" v-model="newAccount.maTaiKhoan" placeholder="Để trống để tự tạo" fluid />
                        </div>
                        <div>
                            <label for="email" class="mb-3 block font-bold">Email *</label>
                            <InputText id="email" v-model.trim="newAccount.email" required="true" :invalid="submitted && !newAccount.email" fluid />
                            <small v-if="submitted && !newAccount.email" class="text-red-500">Email là bắt buộc.</small>
                        </div>
                    </div>
                    <div class="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label for="matKhau" class="mb-3 block font-bold">Mật khẩu *</label>
                            <Password id="matKhau" v-model="newAccount.matKhau" required="true" :invalid="submitted && !newAccount.matKhau" toggleMask fluid>
                                <template #header>
                                    <h6>Nhập mật khẩu</h6>
                                </template>
                                <template #footer>
                                    <Divider />
                                    <p class="mt-2">Yêu cầu</p>
                                    <ul class="ml-2 mt-0 pl-2" style="line-height: 1.5">
                                        <li>Ít nhất một chữ thường</li>
                                        <li>Ít nhất một chữ hoa</li>
                                        <li>Ít nhất một số</li>
                                        <li>Tối thiểu 8 ký tự</li>
                                    </ul>
                                </template>
                            </Password>
                            <small v-if="submitted && !newAccount.matKhau" class="text-red-500">Mật khẩu là bắt buộc.</small>
                        </div>
                        <div>
                            <label for="vaiTro" class="mb-3 block font-bold">Vai trò *</label>
                            <Select
                                id="vaiTro"
                                v-model="newAccount.vaiTro"
                                :options="roleOptionsForForm"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Chọn vai trò"
                                :invalid="submitted && newAccount.vaiTro === undefined"
                                fluid
                                @change="onRoleChange"
                            />
                            <small v-if="submitted && newAccount.vaiTro === undefined" class="text-red-500">Vai trò là bắt buộc.</small>
                        </div>
                    </div>
                    <div class="mt-4">
                        <label for="trangThai" class="mb-3 block font-bold">Trạng thái *</label>
                        <Select id="trangThai" v-model="newAccount.trangThai" :options="statusOptionsForForm" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" :invalid="submitted && newAccount.trangThai === undefined" fluid />
                        <small v-if="submitted && newAccount.trangThai === undefined" class="text-red-500">Trạng thái là bắt buộc.</small>
                    </div>
                </div>

                <!-- Thông tin chi tiết - chỉ hiện với nhân viên và khách hàng -->
                <div v-if="newAccount.vaiTro === 0 || newAccount.vaiTro === 1" class="border-bottom pb-4">
                    <h5 class="mb-3">Thông tin chi tiết</h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="hoTen" class="mb-3 block font-bold">Họ Tên *</label>
                            <InputText id="hoTen" v-model.trim="newAccount.hoTen" required="true" :invalid="submitted && !newAccount.hoTen && (newAccount.vaiTro === 0 || newAccount.vaiTro === 1)" fluid />
                            <small v-if="submitted && !newAccount.hoTen && (newAccount.vaiTro === 0 || newAccount.vaiTro === 1)" class="text-red-500">Họ tên là bắt buộc.</small>
                        </div>
                        <div>
                            <label for="sdt" class="mb-3 block font-bold">Số điện thoại *</label>
                            <InputText id="sdt" v-model="newAccount.sdt" required="true" :invalid="submitted && !newAccount.sdt && (newAccount.vaiTro === 0 || newAccount.vaiTro === 1)" fluid />
                            <small v-if="submitted && !newAccount.sdt && (newAccount.vaiTro === 0 || newAccount.vaiTro === 1)" class="text-red-500">Số điện thoại là bắt buộc.</small>
                        </div>
                    </div>
                </div>

                <!-- Thông tin địa chỉ - chỉ hiện với nhân viên và khách hàng -->
                <div v-if="newAccount.vaiTro === 0 || newAccount.vaiTro === 1">
                    <h5 class="mb-3">Thông tin địa chỉ</h5>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label for="tenKhachHang" class="mb-3 block font-bold">Tên trong địa chỉ</label>
                            <InputText id="tenKhachHang" v-model="newAccount.diaChi.tenKhachHang" placeholder="Để trống sẽ dùng họ tên" fluid />
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label for="tenPhuong" class="mb-3 block font-bold">Phường/Xã *</label>
                                <InputText id="tenPhuong" v-model="newAccount.diaChi.tenPhuong" placeholder="Tên phường/xã" :invalid="submitted && !newAccount.diaChi.tenPhuong && (newAccount.vaiTro === 0 || newAccount.vaiTro === 1)" fluid />
                                <small v-if="submitted && !newAccount.diaChi.tenPhuong && (newAccount.vaiTro === 0 || newAccount.vaiTro === 1)" class="text-red-500">Phường/xã là bắt buộc.</small>
                            </div>
                            <div>
                                <label for="tenHuyen" class="mb-3 block font-bold">Quận/Huyện *</label>
                                <InputText id="tenHuyen" v-model="newAccount.diaChi.tenHuyen" placeholder="Tên quận/huyện" :invalid="submitted && !newAccount.diaChi.tenHuyen && (newAccount.vaiTro === 0 || newAccount.vaiTro === 1)" fluid />
                                <small v-if="submitted && !newAccount.diaChi.tenHuyen && (newAccount.vaiTro === 0 || newAccount.vaiTro === 1)" class="text-red-500">Quận/huyện là bắt buộc.</small>
                            </div>
                            <div>
                                <label for="tenTinh" class="mb-3 block font-bold">Tỉnh/Thành phố *</label>
                                <InputText id="tenTinh" v-model="newAccount.diaChi.tenTinh" placeholder="Tên tỉnh/thành phố" :invalid="submitted && !newAccount.diaChi.tenTinh && (newAccount.vaiTro === 0 || newAccount.vaiTro === 1)" fluid />
                                <small v-if="submitted && !newAccount.diaChi.tenTinh && (newAccount.vaiTro === 0 || newAccount.vaiTro === 1)" class="text-red-500">Tỉnh/thành phố là bắt buộc.</small>
                            </div>
                        </div>
                        <div>
                            <label for="diaChiChiTiet" class="mb-3 block font-bold">Địa chỉ chi tiết</label>
                            <InputText id="diaChiChiTiet" v-model="newAccount.diaChi.diaChiChiTiet" placeholder="Số nhà, tên đường..." fluid />
                        </div>
                    </div>
                </div>

                <!-- Thông báo cho Admin -->
                <div v-if="newAccount.vaiTro === 2" class="rounded-lg bg-blue-50 p-4">
                    <div class="flex items-center gap-3">
                        <i class="pi pi-info-circle text-xl text-blue-600"></i>
                        <div>
                            <h6 class="mb-1 text-blue-700">Tài khoản Admin</h6>
                            <p class="mb-0 text-sm text-blue-600">Tài khoản Admin chỉ cần thông tin đăng nhập cơ bản. Không cần thông tin cá nhân và địa chỉ.</p>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideAddDialog" />
                <Button label="Lưu" icon="pi pi-check" @click="saveNewAccount" />
            </template>
        </Dialog>

        <!-- Edit Account Dialog -->
        <Dialog v-model:visible="editDialog" :style="{ width: '600px' }" header="Cập nhật tài khoản" :modal="true">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="editEmail" class="mb-3 block font-bold">Email *</label>
                    <InputText id="editEmail" v-model.trim="editAccountData.email" required="true" :invalid="submitted && !editAccountData.email" fluid />
                    <small v-if="submitted && !editAccountData.email" class="text-red-500">Email là bắt buộc.</small>
                </div>
                <div>
                    <label for="editMatKhau" class="mb-3 block font-bold">Mật khẩu mới</label>
                    <Password id="editMatKhau" v-model="editAccountData.matKhau" placeholder="Để trống nếu không đổi" toggleMask fluid />
                    <small class="text-muted">Để trống nếu không muốn thay đổi mật khẩu</small>
                </div>
                <div>
                    <label for="editVaiTro" class="mb-3 block font-bold">Vai trò *</label>
                    <Select id="editVaiTro" v-model="editAccountData.vaiTro" :options="roleOptionsForForm" optionLabel="label" optionValue="value" placeholder="Chọn vai trò" :invalid="submitted && editAccountData.vaiTro === undefined" fluid />
                    <small v-if="submitted && editAccountData.vaiTro === undefined" class="text-red-500">Vai trò là bắt buộc.</small>
                </div>
                <div>
                    <label for="editTrangThai" class="mb-3 block font-bold">Trạng thái *</label>
                    <Select
                        id="editTrangThai"
                        v-model="editAccountData.trangThai"
                        :options="statusOptionsForForm"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Chọn trạng thái"
                        :invalid="submitted && editAccountData.trangThai === undefined"
                        fluid
                    />
                    <small v-if="submitted && editAccountData.trangThai === undefined" class="text-red-500">Trạng thái là bắt buộc.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideEditDialog" />
                <Button label="Cập nhật" icon="pi pi-check" @click="updateAccount" />
            </template>
        </Dialog>

        <!-- View Account Dialog -->
        <Dialog v-model:visible="viewDialog" :style="{ width: '700px' }" :header="`Chi tiết tài khoản - ${viewingAccount?.email || 'Tài khoản'}`" :modal="true">
            <div v-if="viewingAccount" class="flex flex-col gap-4">
                <!-- Thông tin tài khoản -->
                <div class="rounded-lg bg-blue-50 p-4">
                    <h6 class="mb-3 font-semibold text-blue-700">Thông tin tài khoản:</h6>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>ID:</strong> #{{ viewingAccount.id }}</div>
                        <div><strong>Mã TK:</strong> {{ viewingAccount.maTaiKhoan }}</div>
                        <div><strong>Email:</strong> {{ viewingAccount.email }}</div>
                        <div>
                            <strong>Vai trò:</strong>
                            <Tag :value="getRoleLabel(viewingAccount.vaiTro)" :severity="getRoleSeverity(viewingAccount.vaiTro)" />
                        </div>
                        <div>
                            <strong>Mật khẩu:</strong>
                            <span class="rounded bg-gray-100 px-2 py-1 font-mono">{{ viewingAccount.matKhau || 'N/A' }}</span>
                        </div>
                        <div>
                            <strong>Trạng thái:</strong>
                            <Tag :value="viewingAccount.trangThai === 1 ? 'Hoạt động' : 'Ngưng'" :severity="viewingAccount.trangThai === 1 ? 'success' : 'danger'" />
                        </div>
                        <div><strong>Ngày tạo:</strong> {{ formatDate(viewingAccount.ngayTao) }}</div>
                        <div><strong>Cập nhật:</strong> {{ formatDate(viewingAccount.ngayCapNhat) }}</div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Đóng" icon="pi pi-times" text @click="viewDialog = false" />
                <Button label="Sửa" icon="pi pi-pencil" @click="editFromView" />
            </template>
        </Dialog>

        <!-- Delete Dialogs -->
        <Dialog v-model:visible="deleteAccountDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="selectedAccountForDelete"
                    >Bạn có chắc chắn muốn xóa tài khoản <b>{{ selectedAccountForDelete.email }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteAccountDialog = false" />
                <Button label="Có" icon="pi pi-check" @click="deleteAccount" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteAccountsDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Bạn có chắc chắn muốn xóa các tài khoản đã chọn?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteAccountsDialog = false" />
                <Button label="Có" icon="pi pi-check" text @click="deleteSelectedAccounts" />
            </template>
        </Dialog>

        <Toast />
    </div>
</template>

<script>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

export default {
    setup() {
        const toast = useToast();
        const dt = ref();
        const accounts = ref([]);
        const addDialog = ref(false);
        const editDialog = ref(false);
        const viewDialog = ref(false);
        const deleteAccountDialog = ref(false);
        const deleteAccountsDialog = ref(false);
        const selectedAccountForDelete = ref(null);
        const viewingAccount = ref(null);
        const selectedAccounts = ref();
        const filters = ref({
            global: { value: null, matchMode: FilterMatchMode.CONTAINS }
        });
        const roleFilter = ref('');
        const statusFilter = ref('');
        const submitted = ref(false);
        const isLoading = ref(false);

        const newAccount = ref({
            maTaiKhoan: '',
            email: '',
            matKhau: '',
            vaiTro: undefined,
            trangThai: 1,
            hoTen: '',
            sdt: '',
            diaChi: {
                maTinh: '',
                maHuyen: '',
                maPhuong: '',
                tenTinh: '',
                tenHuyen: '',
                tenPhuong: '',
                tenKhachHang: '',
                diaChiChiTiet: ''
            }
        });

        const editAccountData = ref({
            id: null,
            email: '',
            matKhau: '',
            vaiTro: undefined,
            trangThai: undefined
        });

        // Updated role options to match backend enum
        const roleOptions = ref([
            { label: 'Tất cả vai trò', value: '' },
            { label: 'Khách hàng', value: 'USER' },
            { label: 'Nhân viên', value: 'NHANVIEN' },
            { label: 'Admin', value: 'ADMIN' }
        ]);

        const roleOptionsForForm = ref([
            { label: 'Khách hàng', value: 'USER' },
            { label: 'Nhân viên', value: 'NHANVIEN' },
            { label: 'Admin', value: 'ADMIN' }
        ]);

        const statusOptions = ref([
            { label: 'Tất cả trạng thái', value: '' },
            { label: 'Hoạt động', value: 1 },
            { label: 'Ngưng hoạt động', value: 0 }
        ]);

        const statusOptionsForForm = ref([
            { label: 'Hoạt động', value: 1 },
            { label: 'Ngưng hoạt động', value: 0 }
        ]);

        // Helper functions
        const formatDate = (date) => {
            if (!date) return '';
            return new Date(date).toLocaleDateString('vi-VN');
        };

        const getRoleLabel = (vaiTro) => {
            console.log('🏷️ Getting role label for:', vaiTro, typeof vaiTro);
            switch (vaiTro) {
                case 'USER':
                    return 'Khách hàng';
                case 'NHANVIEN':
                    return 'Nhân viên';
                case 'ADMIN':
                    return 'Admin';
                default:
                    console.warn('⚠️ Unknown role:', vaiTro);
                    return 'Không xác định';
            }
        };

        const getRoleSeverity = (vaiTro) => {
            switch (vaiTro) {
                case 'USER':
                    return 'primary'; // Khách hàng
                case 'NHANVIEN':
                    return 'success'; // Nhân viên
                case 'ADMIN':
                    return 'warn'; // Admin
                default:
                    return 'secondary';
            }
        };

        const getRoleIcon = (vaiTro) => {
            switch (vaiTro) {
                case 'USER':
                    return 'pi pi-user'; // Khách hàng
                case 'NHANVIEN':
                    return 'pi pi-user-edit'; // Nhân viên
                case 'ADMIN':
                    return 'pi pi-crown'; // Admin
                default:
                    return 'pi pi-question';
            }
        };

        // Convert enum to display value for form validation
        const getVaiTroValue = (vaiTro) => {
            // If it's already a string (enum), return as is
            if (typeof vaiTro === 'string') return vaiTro;
            
            // If it's a number, convert to enum string
            switch (vaiTro) {
                case 0: return 'USER';
                case 1: return 'NHANVIEN';
                case 2: return 'ADMIN';
                default: return vaiTro;
            }
        };

        // Check if role needs detailed info (USER and NHANVIEN)
        const needsDetailedInfo = (vaiTro) => {
            return vaiTro === 'USER' || vaiTro === 'NHANVIEN';
        };

        // Data fetching
        const fetchData = async () => {
            isLoading.value = true;
            console.log('🔄 Đang tải dữ liệu tài khoản...');
            try {
                const res = await axios.get('http://localhost:8080/api/tai-khoan');
                console.log('✅ Response status:', res.status);
                console.log('✅ Raw response data:', res.data);

                if (res.data && Array.isArray(res.data)) {
                    accounts.value = res.data;
                    console.log('✅ Loaded', accounts.value.length, 'accounts');
                    
                    // Debug first account
                    if (accounts.value.length > 0) {
                        console.log('🔍 First account:', accounts.value[0]);
                        console.log('🔍 vaiTro type:', typeof accounts.value[0].vaiTro);
                        console.log('🔍 vaiTro value:', accounts.value[0].vaiTro);
                    }
                } else {
                    accounts.value = [];
                    console.warn('⚠️ No data or invalid format');
                }
            } catch (error) {
                console.error('❌ Error fetching data:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi kết nối',
                    detail: `Không thể tải dữ liệu: ${error.message}`,
                    life: 5000
                });
                accounts.value = [];
            } finally {
                isLoading.value = false;
            }
        };

        // Computed properties
        const filteredAccounts = computed(() => {
            console.log('🔍 Computing filtered accounts...');
            console.log('🔍 Raw accounts:', accounts.value);
            console.log('🔍 Role filter:', roleFilter.value);
            console.log('🔍 Status filter:', statusFilter.value);

            let filtered = accounts.value || [];
            console.log('🔍 Initial filtered count:', filtered.length);

            if (roleFilter.value !== '') {
                const beforeFilter = filtered.length;
                filtered = filtered.filter((acc) => {
                    console.log(`🔍 Checking account ${acc.id}: vaiTro=${acc.vaiTro}, filter=${roleFilter.value}`);
                    return acc.vaiTro === roleFilter.value;
                });
                console.log(`🔍 After role filter: ${beforeFilter} → ${filtered.length}`);
            }

            if (statusFilter.value !== '') {
                const beforeFilter = filtered.length;
                filtered = filtered.filter((acc) => {
                    console.log(`🔍 Checking account ${acc.id}: trangThai=${acc.trangThai}, filter=${statusFilter.value}`);
                    return acc.trangThai === parseInt(statusFilter.value);
                });
                console.log(`🔍 After status filter: ${beforeFilter} → ${filtered.length}`);
            }

            console.log('🔍 Final filtered accounts:', filtered);
            console.log('🔍 Final filtered count:', filtered.length);
            return filtered;
        });

        // Dialog management
        const openNew = () => {
            newAccount.value = {
                maTaiKhoan: '',
                email: '',
                matKhau: '',
                vaiTro: undefined,
                trangThai: 1,
                hoTen: '',
                sdt: '',
                diaChi: {
                    maTinh: '',
                    maHuyen: '',
                    maPhuong: '',
                    tenTinh: '',
                    tenHuyen: '',
                    tenPhuong: '',
                    tenKhachHang: '',
                    diaChiChiTiet: ''
                }
            };
            submitted.value = false;
            addDialog.value = true;
        };

        const onRoleChange = () => {
            // Reset thông tin chi tiết khi thay đổi vai trò
            if (newAccount.value.vaiTro === 'ADMIN') {
                // Admin
                newAccount.value.hoTen = '';
                newAccount.value.sdt = '';
                newAccount.value.diaChi = {
                    maTinh: '',
                    maHuyen: '',
                    maPhuong: '',
                    tenTinh: '',
                    tenHuyen: '',
                    tenPhuong: '',
                    tenKhachHang: '',
                    diaChiChiTiet: ''
                };
            }
        };

        const viewAccount = (acc) => {
            viewingAccount.value = { ...acc };
            viewDialog.value = true;
        };

        const editFromView = () => {
            editAccountData.value = {
                id: viewingAccount.value.id,
                email: viewingAccount.value.email,
                matKhau: '',
                vaiTro: viewingAccount.value.vaiTro,
                trangThai: viewingAccount.value.trangThai
            };
            viewDialog.value = false;
            editDialog.value = true;
        };

        const editAccount = (acc) => {
            editAccountData.value = {
                id: acc.id,
                email: acc.email,
                matKhau: '',
                vaiTro: acc.vaiTro,
                trangThai: acc.trangThai
            };
            editDialog.value = true;
        };

        const hideAddDialog = () => {
            addDialog.value = false;
            submitted.value = false;
        };

        const hideEditDialog = () => {
            editDialog.value = false;
            submitted.value = false;
        };

        // CRUD operations
        const saveNewAccount = async () => {
            submitted.value = true;

            // Validate basic required fields
            if (!newAccount.value.email?.trim() || !newAccount.value.matKhau?.trim() || newAccount.value.vaiTro === undefined || newAccount.value.trangThai === undefined) {
                toast.add({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                    life: 3000
                });
                return;
            }

            // Additional validation for employee and customer roles
            if (needsDetailedInfo(newAccount.value.vaiTro)) {
                if (!newAccount.value.hoTen?.trim() || !newAccount.value.sdt?.trim() || !newAccount.value.diaChi?.tenTinh?.trim() || !newAccount.value.diaChi?.tenHuyen?.trim() || !newAccount.value.diaChi?.tenPhuong?.trim()) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Cảnh báo',
                        detail: 'Vui lòng điền đầy đủ thông tin chi tiết và địa chỉ cho nhân viên/khách hàng',
                        life: 3000
                    });
                    return;
                }
            }

            try {
                await axios.post('http://localhost:8080/api/tai-khoan', newAccount.value);

                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Thêm tài khoản thành công',
                    life: 3000
                });

                await fetchData();
                hideAddDialog();
            } catch (error) {
                console.error('Error saving account:', error);

                if (error.response?.status === 409) {
                    toast.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Email đã tồn tại trong hệ thống',
                        life: 3000
                    });
                } else {
                    toast.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Có lỗi xảy ra khi thêm tài khoản',
                        life: 3000
                    });
                }
            }
        };

        const updateAccount = async () => {
            submitted.value = true;

            if (!editAccountData.value.email?.trim() || editAccountData.value.vaiTro === undefined || editAccountData.value.trangThai === undefined) {
                toast.add({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                    life: 3000
                });
                return;
            }

            try {
                await axios.put(`http://localhost:8080/api/tai-khoan/${editAccountData.value.id}`, {
                    email: editAccountData.value.email,
                    matKhau: editAccountData.value.matKhau || undefined,
                    vaiTro: editAccountData.value.vaiTro,
                    trangThai: editAccountData.value.trangThai
                });

                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Cập nhật tài khoản thành công',
                    life: 3000
                });

                await fetchData();
                hideEditDialog();
            } catch (error) {
                console.error('Error updating account:', error);

                if (error.response?.status === 409) {
                    toast.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Email đã tồn tại trong hệ thống',
                        life: 3000
                    });
                } else {
                    toast.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Có lỗi xảy ra khi cập nhật tài khoản',
                        life: 3000
                    });
                }
            }
        };

        const confirmDeleteAccount = (acc) => {
            selectedAccountForDelete.value = acc;
            deleteAccountDialog.value = true;
        };

        const deleteAccount = async () => {
            try {
                await axios.delete(`http://localhost:8080/api/tai-khoan/${selectedAccountForDelete.value.id}`);
                await fetchData();
                deleteAccountDialog.value = false;
                selectedAccountForDelete.value = null;
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Xóa tài khoản thành công',
                    life: 3000
                });
            } catch (error) {
                console.error('Error deleting account:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Có lỗi xảy ra khi xóa tài khoản',
                    life: 3000
                });
            }
        };

        const changeStatus = async (acc) => {
            try {
                const newStatus = acc.trangThai === 1 ? 0 : 1;
                await axios.put(`http://localhost:8080/api/tai-khoan/${acc.id}`, {
                    email: acc.email,
                    vaiTro: acc.vaiTro,
                    trangThai: newStatus
                });
                await fetchData();
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: `Đã ${newStatus === 1 ? 'kích hoạt' : 'ngưng'} tài khoản`,
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
        };

        const confirmDeleteSelected = () => {
            deleteAccountsDialog.value = true;
        };

        const deleteSelectedAccounts = async () => {
            try {
                for (const acc of selectedAccounts.value) {
                    await axios.delete(`http://localhost:8080/api/tai-khoan/${acc.id}`);
                }
                await fetchData();
                deleteAccountsDialog.value = false;
                selectedAccounts.value = null;
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Xóa các tài khoản thành công',
                    life: 3000
                });
            } catch (error) {
                console.error('Error deleting accounts:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Có lỗi xảy ra khi xóa tài khoản',
                    life: 3000
                });
            }
        };

        const exportCSV = () => {
            try {
                if (!accounts.value || accounts.value.length === 0) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Cảnh báo',
                        detail: 'Không có dữ liệu để xuất',
                        life: 3000
                    });
                    return;
                }

                const headers = ['ID', 'Mã Tài Khoản', 'Email', 'Vai Trò', 'Trạng Thái', 'Ngày Tạo'];

                const csvData = accounts.value.map((item) => [
                    item.id || '', 
                    item.maTaiKhoan || '', 
                    item.email || '', 
                    getRoleLabel(item.vaiTro), 
                    item.trangThai === 1 ? 'Hoạt động' : 'Ngưng hoạt động', 
                    formatDate(item.ngayTao)
                ]);

                const csvContent = [headers, ...csvData].map((row) => 
                    row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')
                ).join('\n');

                const BOM = '\uFEFF';
                const csvWithBOM = BOM + csvContent;

                const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `TaiKhoan-${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: `Đã xuất ${accounts.value.length} bản ghi ra file CSV`,
                    life: 3000
                });
            } catch (error) {
                console.error('Error exporting CSV:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Xuất CSV thất bại',
                    life: 3000
                });
            }
        };

        // Lifecycle
        onMounted(() => {
            console.log('🚀 Component mounted, fetching data...');
            fetchData();
        });

        // Return all reactive data and functions for template
        return {
            // Reactive data
            dt,
            accounts,
            addDialog,
            editDialog,
            viewDialog,
            deleteAccountDialog,
            deleteAccountsDialog,
            selectedAccountForDelete,
            viewingAccount,
            selectedAccounts,
            filters,
            roleFilter,
            statusFilter,
            submitted,
            isLoading,
            newAccount,
            editAccountData,
            roleOptions,
            roleOptionsForForm,
            statusOptions,
            statusOptionsForForm,

            // Computed
            filteredAccounts,

            // Functions
            formatDate,
            getRoleLabel,
            getRoleSeverity,
            getRoleIcon,
            getVaiTroValue,
            needsDetailedInfo,
            fetchData,
            openNew,
            onRoleChange,
            viewAccount,
            editFromView,
            editAccount,
            hideAddDialog,
            hideEditDialog,
            saveNewAccount,
            updateAccount,
            confirmDeleteAccount,
            deleteAccount,
            changeStatus,
            confirmDeleteSelected,
            deleteSelectedAccounts,
            exportCSV
        };
    }
};
</script>

<style scoped>
.card {
    border: none;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.border-bottom {
    border-bottom: 1px solid #e9ecef;
}
</style>
