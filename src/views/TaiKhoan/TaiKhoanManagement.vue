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
                <div class="flex flex-wrap gap-2 items-center justify-between">
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
                        <i class="pi pi-envelope mr-2 text-muted"></i>
                        <span>{{ slotProps.data.email }}</span>
                    </div>
                </template>
            </Column>
            <Column field="vaiTro" header="Vai trò" sortable style="width: 12rem">
                <template #body="slotProps">
                    <Tag :value="getRoleLabel(slotProps.data.vaiTro)" :severity="slotProps.data.vaiTro ? 'success' : 'primary'">
                        <i :class="slotProps.data.vaiTro ? 'pi pi-user-edit' : 'pi pi-user'" class="mr-1"></i>
                        {{ getRoleLabel(slotProps.data.vaiTro) }}
                    </Tag>
                </template>
            </Column>
            <Column header="Thông tin chi tiết" style="min-width: 18rem">
                <template #body="slotProps">
                    <div v-if="slotProps.data.detailInfo" class="flex flex-col">
                        <span class="font-semibold">{{ slotProps.data.detailInfo.hoTen }}</span>
                        <span class="text-sm text-muted">{{ slotProps.data.detailInfo.sdt || 'Chưa cập nhật' }}</span>
                        <span class="text-sm text-muted">{{ formatAddress(slotProps.data.detailInfo.diaChi) }}</span>
                    </div>
                    <span v-else class="text-muted">Chưa có thông tin</span>
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
                <div class="text-center p-5">
                    <i class="pi pi-users text-5xl text-muted mb-3"></i>
                    <h5 class="text-muted">Không tìm thấy tài khoản</h5>
                    <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm tài khoản mới.</p>
                </div>
            </template>
        </DataTable>

        <!-- Add/Edit Account Dialog -->
        <Dialog v-model:visible="accountDialog" :style="{ width: '900px' }" :header="account.id ? 'Cập nhật tài khoản' : 'Thêm tài khoản'" :modal="true">
            <div class="flex flex-col gap-6">
                <!-- Thông tin tài khoản -->
                <div class="border-bottom pb-4">
                    <h5 class="mb-3">Thông tin đăng nhập</h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="maTaiKhoan" class="block font-bold mb-3">Mã tài khoản</label>
                            <InputText id="maTaiKhoan" v-model="account.maTaiKhoan" disabled fluid />
                        </div>
                        <div>
                            <label for="email" class="block font-bold mb-3">Email *</label>
                            <InputText id="email" v-model.trim="account.email" required="true" :invalid="submitted && !account.email" fluid />
                            <small v-if="submitted && !account.email" class="text-red-500">Email là bắt buộc.</small>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label for="matKhau" class="block font-bold mb-3">Mật khẩu {{ account.id ? '' : '*' }}</label>
                            <Password id="matKhau" v-model="account.matKhau" :required="!account.id" :invalid="submitted && !account.id && !account.matKhau" toggleMask fluid>
                                <template #header>
                                    <h6>Nhập mật khẩu</h6>
                                </template>
                                <template #footer>
                                    <Divider />
                                    <p class="mt-2">Yêu cầu</p>
                                    <ul class="pl-2 ml-2 mt-0" style="line-height: 1.5">
                                        <li>Ít nhất một chữ thường</li>
                                        <li>Ít nhất một chữ hoa</li>
                                        <li>Ít nhất một số</li>
                                        <li>Tối thiểu 8 ký tự</li>
                                    </ul>
                                </template>
                            </Password>
                            <small v-if="submitted && !account.id && !account.matKhau" class="text-red-500">Mật khẩu là bắt buộc khi thêm mới.</small>
                        </div>
                        <div>
                            <label for="vaiTro" class="block font-bold mb-3">Vai trò *</label>
                            <Select id="vaiTro" v-model="account.vaiTro" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="Chọn vai trò" :invalid="submitted && account.vaiTro === undefined" fluid />
                            <small v-if="submitted && account.vaiTro === undefined" class="text-red-500">Vai trò là bắt buộc.</small>
                        </div>
                    </div>
                    <div class="mt-4">
                        <label for="trangThai" class="block font-bold mb-3">Trạng thái *</label>
                        <Select id="trangThai" v-model="account.trangThai" :options="statusOptions.slice(1)" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" :invalid="submitted && account.trangThai === undefined" fluid />
                        <small v-if="submitted && account.trangThai === undefined" class="text-red-500">Trạng thái là bắt buộc.</small>
                    </div>
                </div>

                <!-- Thông tin chi tiết -->
                <div v-if="account.vaiTro !== undefined" class="border-bottom pb-4">
                    <h5 class="mb-3">Thông tin chi tiết</h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="hoTen" class="block font-bold mb-3">Họ Tên *</label>
                            <InputText id="hoTen" v-model.trim="account.detailInfo.hoTen" required="true" :invalid="submitted && !account.detailInfo.hoTen" fluid />
                            <small v-if="submitted && !account.detailInfo.hoTen" class="text-red-500">Họ tên là bắt buộc.</small>
                        </div>
                        <div>
                            <label for="sdt" class="block font-bold mb-3">Số điện thoại *</label>
                            <InputText id="sdt" v-model="account.detailInfo.sdt" required="true" :invalid="submitted && !account.detailInfo.sdt" fluid />
                            <small v-if="submitted && !account.detailInfo.sdt" class="text-red-500">Số điện thoại là bắt buộc.</small>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 gap-4 mt-4">
                        <div>
                            <label for="tenKhachHang" class="block font-bold mb-3">Tên trong địa chỉ</label>
                            <InputText id="tenKhachHang" v-model="account.detailInfo.diaChi.tenKhachHang" placeholder="Tên trong địa chỉ..." fluid />
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label for="tenPhuong" class="block font-bold mb-3">Phường/Xã *</label>
                                <InputText id="tenPhuong" v-model="account.detailInfo.diaChi.tenPhuong" placeholder="Tên phường/xã" :invalid="submitted && !account.detailInfo.diaChi.tenPhuong" fluid />
                                <small v-if="submitted && !account.detailInfo.diaChi.tenPhuong" class="text-red-500">Phường/xã là bắt buộc.</small>
                            </div>
                            <div>
                                <label for="tenHuyen" class="block font-bold mb-3">Quận/Huyện *</label>
                                <InputText id="tenHuyen" v-model="account.detailInfo.diaChi.tenHuyen" placeholder="Tên quận/huyện" :invalid="submitted && !account.detailInfo.diaChi.tenHuyen" fluid />
                                <small v-if="submitted && !account.detailInfo.diaChi.tenHuyen" class="text-red-500">Quận/huyện là bắt buộc.</small>
                            </div>
                            <div>
                                <label for="tenTinh" class="block font-bold mb-3">Tỉnh/Thành phố *</label>
                                <InputText id="tenTinh" v-model="account.detailInfo.diaChi.tenTinh" placeholder="Tên tỉnh/thành phố" :invalid="submitted && !account.detailInfo.diaChi.tenTinh" fluid />
                                <small v-if="submitted && !account.detailInfo.diaChi.tenTinh" class="text-red-500">Tỉnh/thành phố là bắt buộc.</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Lưu" icon="pi pi-check" @click="saveAccount" />
            </template>
        </Dialog>

        <!-- View Account Dialog -->
        <Dialog v-model:visible="viewDialog" :style="{ width: '700px' }" :header="`Chi tiết tài khoản - ${viewingAccount?.email || 'Tài khoản'}`" :modal="true">
            <div v-if="viewingAccount" class="flex flex-col gap-4">
                <!-- Thông tin tài khoản -->
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h6 class="font-semibold text-blue-700 mb-3">Thông tin tài khoản:</h6>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>ID:</strong> #{{ viewingAccount.id }}</div>
                        <div><strong>Mã TK:</strong> {{ viewingAccount.maTaiKhoan }}</div>
                        <div><strong>Email:</strong> {{ viewingAccount.email }}</div>
                        <div>
                            <strong>Vai trò:</strong>
                            <Tag :value="getRoleLabel(viewingAccount.vaiTro)" :severity="viewingAccount.vaiTro ? 'success' : 'primary'" />
                        </div>
                        <div>
                            <strong>Trạng thái:</strong>
                            <Tag :value="viewingAccount.trangThai === 1 ? 'Hoạt động' : 'Ngưng'" :severity="viewingAccount.trangThai === 1 ? 'success' : 'danger'" />
                        </div>
                        <div><strong>Ngày tạo:</strong> {{ formatDate(viewingAccount.ngayTao) }}</div>
                        <div><strong>Cập nhật:</strong> {{ formatDate(viewingAccount.ngayCapNhat) }}</div>
                    </div>
                </div>

                <!-- Thông tin chi tiết -->
                <div v-if="viewingAccount.detailInfo" class="bg-gray-50 p-4 rounded-lg">
                    <h6 class="font-semibold text-gray-700 mb-3">Thông tin chi tiết:</h6>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>Họ tên:</strong> {{ viewingAccount.detailInfo.hoTen }}</div>
                        <div><strong>SĐT:</strong> {{ viewingAccount.detailInfo.sdt || 'Chưa cập nhật' }}</div>
                        <div class="col-span-2"><strong>Địa chỉ:</strong> {{ formatAddress(viewingAccount.detailInfo.diaChi) }}</div>
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
                <span v-if="account"
                    >Bạn có chắc chắn muốn xóa tài khoản <b>{{ account.email }}</b
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

<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();
const accounts = ref([]);
const accountDialog = ref(false);
const viewDialog = ref(false);
const deleteAccountDialog = ref(false);
const deleteAccountsDialog = ref(false);
const account = ref({});
const viewingAccount = ref(null);
const selectedAccounts = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const roleFilter = ref('');
const statusFilter = ref('');
const submitted = ref(false);
const isLoading = ref(false);

const roleOptions = ref([
    { label: 'Tất cả vai trò', value: '' },
    { label: 'Nhân viên', value: true },
    { label: 'Khách hàng', value: false }
]);

const statusOptions = ref([
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngưng hoạt động', value: 0 }
]);

async function generateAccountCode() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    let suffix = 1;
    let newCode = `TK-${dateStr}-${String(suffix).padStart(3, '0')}`;

    try {
        while (true) {
            const res = await axios.get(`http://localhost:8080/tai-khoan/check-code?code=${newCode}`);
            if (res.data.available) break;
            suffix++;
            newCode = `TK-${dateStr}-${String(suffix).padStart(3, '0')}`;
        }
        return newCode;
    } catch (error) {
        console.error('Error generating account code:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tạo mã tài khoản',
            life: 3000
        });
        return null;
    }
}

async function checkEmailExists(email) {
    try {
        const res = await axios.get(`http://localhost:8080/tai-khoan/check-email?email=${email}`);
        return res.data.exists;
    } catch (error) {
        console.error('Error checking email:', error);
        return false;
    }
}

onMounted(() => {
    fetchData();
});

async function fetchData() {
    isLoading.value = true;
    try {
        const res = await axios.get('http://localhost:8080/tai-khoan');
        accounts.value = res.data.map((acc) => ({
            ...acc,
            detailInfo: acc.detailInfo || {
                hoTen: '',
                sdt: '',
                diaChi: { tenKhachHang: '', tenPhuong: '', tenHuyen: '', tenTinh: '' }
            }
        }));
    } catch (error) {
        console.error('Error fetching data:', error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi tải dữ liệu tài khoản', life: 3000 });
    } finally {
        isLoading.value = false;
    }
}

const filteredAccounts = computed(() => {
    let filtered = accounts.value;
    if (roleFilter.value !== '') {
        filtered = filtered.filter((acc) => acc.vaiTro === roleFilter.value);
    }
    if (statusFilter.value !== '') {
        filtered = filtered.filter((acc) => acc.trangThai === parseInt(statusFilter.value));
    }
    return filtered;
});

function openNew() {
    account.value = {
        vaiTro: undefined,
        trangThai: 1,
        detailInfo: {
            hoTen: '',
            sdt: '',
            diaChi: {
                tenKhachHang: '',
                tenPhuong: '',
                tenHuyen: '',
                tenTinh: ''
            }
        }
    };
    submitted.value = false;
    accountDialog.value = true;
}

function viewAccount(acc) {
    viewingAccount.value = { ...acc };
    viewDialog.value = true;
}

function editFromView() {
    account.value = { ...viewingAccount.value, trangThai: viewingAccount.value.trangThai ?? 1 };
    if (!account.value.detailInfo) {
        account.value.detailInfo = {
            hoTen: '',
            sdt: '',
            diaChi: {
                tenKhachHang: '',
                tenPhuong: '',
                tenHuyen: '',
                tenTinh: ''
            }
        };
    }
    viewDialog.value = false;
    accountDialog.value = true;
}

async function editAccount(acc) {
    account.value = { ...acc, trangThai: acc.trangThai ?? 1 };
    if (!account.value.detailInfo) {
        account.value.detailInfo = {
            hoTen: '',
            sdt: '',
            diaChi: {
                tenKhachHang: '',
                tenPhuong: '',
                tenHuyen: '',
                tenTinh: ''
            }
        };
    }
    accountDialog.value = true;
}

function hideDialog() {
    accountDialog.value = false;
    submitted.value = false;
    account.value = {};
}

async function saveAccount() {
    submitted.value = true;

    if (
        !account.value.email?.trim() ||
        (!account.value.id && !account.value.matKhau?.trim()) ||
        account.value.vaiTro === undefined ||
        account.value.trangThai === undefined ||
        !account.value.detailInfo?.hoTen?.trim() ||
        !account.value.detailInfo?.sdt?.trim() ||
        !account.value.detailInfo?.diaChi?.tenPhuong?.trim() ||
        !account.value.detailInfo?.diaChi?.tenHuyen?.trim() ||
        !account.value.detailInfo?.diaChi?.tenTinh?.trim()
    ) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Vui lòng điền đầy đủ thông tin bắt buộc',
            life: 3000
        });
        return;
    }

    try {
        // Kiểm tra email trùng lặp
        if (!account.value.id) {
            const emailExists = await checkEmailExists(account.value.email);
            if (emailExists) {
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Email đã tồn tại trong hệ thống',
                    life: 3000
                });
                return;
            }
        }

        // Tạo mã tài khoản nếu là thêm mới
        if (!account.value.maTaiKhoan) {
            const newCode = await generateAccountCode();
            if (!newCode) return;
            account.value.maTaiKhoan = newCode;
        }

        // Lưu địa chỉ
        let addressId = account.value.detailInfo.diaChi.id;
        if (!addressId) {
            const addressRes = await axios.post('http://localhost:8080/api/dia-chi', account.value.detailInfo.diaChi);
            addressId = addressRes.data.id;
        } else {
            await axios.put(`http://localhost:8080/api/dia-chi/${addressId}`, account.value.detailInfo.diaChi);
        }

        // Chuẩn bị dữ liệu tài khoản
        const accountData = {
            ...account.value,
            detailInfo: {
                ...account.value.detailInfo,
                diaChi: addressId
            }
        };

        // Lưu tài khoản
        let accountId;
        if (account.value.id) {
            await axios.put(`http://localhost:8080/tai-khoan/${account.value.id}`, accountData);
            accountId = account.value.id;
            toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật tài khoản thành công', life: 3000 });
        } else {
            const accountRes = await axios.post('http://localhost:8080/tai-khoan', accountData);
            accountId = accountRes.data.id;
            toast.add({ severity: 'success', summary: 'Thành công', detail: 'Thêm tài khoản thành công', life: 3000 });
        }

        // Đồng bộ với NhanVien hoặc KhachHang
        if (account.value.vaiTro === true) {
            // Nhân viên
            const employeeData = {
                hoTen: account.value.detailInfo.hoTen,
                email: account.value.email,
                sdt: account.value.detailInfo.sdt,
                diaChi: addressId,
                taiKhoan: accountId,
                trangThai: account.value.trangThai,
                maNhanVien: account.value.maTaiKhoan.replace('TK', 'NV')
            };
            if (account.value.detailInfo.id) {
                await axios.put(`http://localhost:8080/nhan-vien/${account.value.detailInfo.id}`, employeeData);
            } else {
                await axios.post('http://localhost:8080/nhan-vien', employeeData);
            }
        } else if (account.value.vaiTro === false) {
            // Khách hàng
            const viDiemRes = await axios.post('http://localhost:8080/api/vi-diem', {
                diemHienTai: 0,
                tongDiemDaDung: 0,
                tongDiemTichLuy: 0,
                trangThai: 1
            });
            const customerData = {
                hoTen: account.value.detailInfo.hoTen,
                email: account.value.email,
                sdt: account.value.detailInfo.sdt,
                diaChi: addressId,
                taiKhoan: accountId,
                viDiem: viDiemRes.data.id,
                trangThai: account.value.trangThai,
                maKhachHang: account.value.maTaiKhoan.replace('TK', 'KH')
            };
            if (account.value.detailInfo.id) {
                await axios.put(`http://localhost:8080/khach-hang/${account.value.detailInfo.id}`, customerData);
            } else {
                await axios.post('http://localhost:8080/khach-hang', customerData);
            }
        }

        await fetchData();
        accountDialog.value = false;
        account.value = {};
    } catch (error) {
        console.error('Error saving account:', error);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: `Có lỗi xảy ra khi lưu tài khoản: ${error.response?.data?.message || error.message}`,
            life: 5000
        });
    }
}

function confirmDeleteAccount(acc) {
    account.value = acc;
    deleteAccountDialog.value = true;
}

async function deleteAccount() {
    try {
        await axios.delete(`http://localhost:8080/tai-khoan/${account.value.id}`);
        await fetchData();
        deleteAccountDialog.value = false;
        account.value = {};
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
}

async function changeStatus(acc) {
    try {
        const newStatus = acc.trangThai === 1 ? 0 : 1;
        await axios.put(`http://localhost:8080/tai-khoan/${acc.id}`, {
            ...acc,
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
}

function confirmDeleteSelected() {
    deleteAccountsDialog.value = true;
}

async function deleteSelectedAccounts() {
    try {
        for (const acc of selectedAccounts.value) {
            await axios.delete(`http://localhost:8080/tai-khoan/${acc.id}`);
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
}

function exportCSV() {
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

        const headers = ['ID', 'Mã Tài Khoản', 'Email', 'Vai Trò', 'Họ Tên', 'SĐT', 'Địa Chỉ', 'Trạng Thái', 'Ngày Tạo'];

        const csvData = accounts.value.map((item) => [
            item.id || '',
            item.maTaiKhoan || '',
            item.email || '',
            getRoleLabel(item.vaiTro),
            item.detailInfo?.hoTen || '',
            item.detailInfo?.sdt || '',
            formatAddress(item.detailInfo?.diaChi) || '',
            item.trangThai === 1 ? 'Hoạt động' : 'Ngừng hoạt động',
            formatDate(item.ngayTao)
        ]);

        const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');

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
}

function getRoleLabel(vaiTro) {
    return vaiTro ? 'Nhân viên' : vaiTro === false ? 'Khách hàng' : 'Không xác định';
}

function formatAddress(diaChi) {
    if (!diaChi) return 'Chưa cập nhật địa chỉ';
    const parts = [diaChi.tenPhuong, diaChi.tenHuyen, diaChi.tenTinh].filter((part) => part && part.trim() !== '');
    return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật thông tin';
}

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
}
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
