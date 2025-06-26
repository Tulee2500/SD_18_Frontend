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
        <div class="flex flex-wrap gap-2 items-center justify-between">
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
            <span class="rounded-circle w-2rem h-2rem flex items-center justify-center text-white font-bold mr-3" :style="{ background: 'linear-gradient(45deg, #007bff, #6f42c1)' }">
              {{ getInitials(slotProps.data.hoTen) }}
            </span>
            <div class="flex flex-col">
              <span class="font-semibold">{{ slotProps.data.hoTen }}</span>
              <span class="text-sm text-muted">{{ slotProps.data.email }}</span>
            </div>
          </div>
        </template>
      </Column>
      <Column header="Liên hệ" style="min-width: 14rem">
        <template #body="slotProps">
          <div class="flex flex-col">
            <span class="mb-1">
              <i class="pi pi-phone mr-1 text-muted"></i>
              {{ slotProps.data.sdt }}
            </span>
            <span class="text-sm text-muted">
              <i class="pi pi-user mr-1 text-muted"></i>
              {{ slotProps.data.taiKhoan?.email || 'Chưa có tài khoản' }}
            </span>
          </div>
        </template>
      </Column>
      <Column header="Địa chỉ" style="min-width: 18rem">
        <template #body="slotProps">
          <div class="flex flex-col">
            <span class="text-sm text-muted">
              <i class="pi pi-map-marker mr-1 text-muted"></i>
              {{ formatFullAddress(slotProps.data.diaChi) }}
            </span>
          </div>
        </template>
      </Column>
      <Column header="Điểm tích lũy" style="width: 10rem">
        <template #body="slotProps">
          <div class="flex items-center">
            <i class="pi pi-star mr-1 text-yellow-500"></i>
            <span class="font-semibold">{{ slotProps.data.viDiem?.diemHienTai || 0 }}</span>
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
        <div class="text-center p-5">
          <i class="pi pi-users text-5xl text-muted mb-3"></i>
          <h5 class="text-muted">Không tìm thấy khách hàng</h5>
          <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm khách hàng mới trong phần quản lý tài khoản.</p>
        </div>
      </template>
    </DataTable>

    <!-- View Customer Dialog -->
    <Dialog v-model:visible="viewDialog" :style="{ width: '700px' }" :header="`Chi tiết khách hàng - ${viewingCustomer?.hoTen || 'N/A'}`" :modal="true">
      <div v-if="viewingCustomer" class="flex flex-col gap-4">
        <!-- Thông tin cơ bản -->
        <div class="bg-blue-50 p-4 rounded-lg">
          <h6 class="font-semibold text-blue-700 mb-3">Thông tin khách hàng:</h6>
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
            <div><strong>Ngày tạo:</strong> {{ formatDate(viewingCustomer.ngayTao) }}</div>
            <div><strong>Cập nhật:</strong> {{ formatDate(viewingCustomer.ngayCapNhat) }}</div>
          </div>
        </div>

        <!-- Thông tin điểm tích lũy -->
        <div v-if="viewingCustomer.viDiem" class="bg-yellow-50 p-4 rounded-lg">
          <h6 class="font-semibold text-yellow-700 mb-3">Thông tin điểm tích lũy:</h6>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><strong>Điểm hiện tại:</strong> <span class="font-bold text-yellow-600">{{ viewingCustomer.viDiem.diemHienTai || 0 }}</span></div>
            <div><strong>Tổng điểm đã dùng:</strong> {{ viewingCustomer.viDiem.tongDiemDaDung || 0 }}</div>
            <div><strong>Tổng điểm tích lũy:</strong> {{ viewingCustomer.viDiem.tongDiemTichLuy || 0 }}</div>
            <div>
              <strong>Trạng thái ví:</strong>
              <Tag :value="viewingCustomer.viDiem.trangThai === 1 ? 'Hoạt động' : 'Ngưng'" :severity="viewingCustomer.viDiem.trangThai === 1 ? 'success' : 'danger'" />
            </div>
          </div>
        </div>

        <!-- Thông tin tài khoản -->
        <div v-if="viewingCustomer.taiKhoan" class="bg-green-50 p-4 rounded-lg">
          <h6 class="font-semibold text-green-700 mb-3">Thông tin tài khoản:</h6>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><strong>Mã TK:</strong> {{ viewingCustomer.taiKhoan.maTaiKhoan }}</div>
            <div><strong>Email TK:</strong> {{ viewingCustomer.taiKhoan.email }}</div>
            <div><strong>Vai trò:</strong> Khách hàng</div>
            <div>
              <strong>Trạng thái TK:</strong>
              <Tag :value="viewingCustomer.taiKhoan.trangThai === 1 ? 'Hoạt động' : 'Ngưng'" :severity="viewingCustomer.taiKhoan.trangThai === 1 ? 'success' : 'danger'" />
            </div>
          </div>
        </div>

        <!-- Thông tin địa chỉ -->
        <div v-if="viewingCustomer.diaChi" class="bg-gray-50 p-4 rounded-lg">
          <h6 class="font-semibold text-gray-700 mb-3">Thông tin địa chỉ:</h6>
          <div class="text-sm">
            <div><strong>Tên:</strong> {{ viewingCustomer.diaChi.tenKhachHang || 'N/A' }}</div>
            <div><strong>Địa chỉ:</strong> {{ formatFullAddress(viewingCustomer.diaChi) }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Đóng" icon="pi pi-times" text @click="viewDialog = false" />
        <Button label="Sửa" icon="pi pi-pencil" @click="editFromView" />
      </template>
    </Dialog>

    <!-- Edit Customer Dialog -->
    <Dialog v-model:visible="customerDialog" :style="{ width: '700px' }" :header="`Cập nhật khách hàng - ${customer.hoTen || 'Khách hàng'}`" :modal="true">
      <div class="flex flex-col gap-6">
        <!-- Thông tin cơ bản -->
        <div class="border-bottom pb-4">
          <h5 class="mb-3">Thông tin cơ bản</h5>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="hoTen" class="block font-bold mb-3">Họ Tên *</label>
              <InputText id="hoTen" v-model.trim="customer.hoTen" required="true" :invalid="submitted && !customer.hoTen" fluid />
              <small v-if="submitted && !customer.hoTen" class="text-red-500">Họ tên là bắt buộc.</small>
            </div>
            <div>
              <label for="maKhachHang" class="block font-bold mb-3">Mã khách hàng</label>
              <InputText id="maKhachHang" v-model="customer.maKhachHang" disabled fluid />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label for="email" class="block font-bold mb-3">Email *</label>
              <InputText id="email" v-model="customer.email" required="true" :invalid="submitted && (!customer.email || !isValidEmail(customer.email))" fluid />
              <small v-if="submitted && !customer.email" class="text-red-500">Email là bắt buộc.</small>
              <small v-if="submitted && customer.email && !isValidEmail(customer.email)" class="text-red-500">Email không hợp lệ.</small>
            </div>
            <div>
              <label for="sdt" class="block font-bold mb-3">Số điện thoại *</label>
              <InputText id="sdt" v-model="customer.sdt" required="true" :invalid="submitted && (!customer.sdt || !isValidPhone(customer.sdt))" fluid />
              <small v-if="submitted && !customer.sdt" class="text-red-500">Số điện thoại là bắt buộc.</small>
              <small v-if="submitted && customer.sdt && !isValidPhone(customer.sdt)" class="text-red-500">Số điện thoại không hợp lệ.</small>
            </div>
          </div>
        </div>

        <!-- Thông tin địa chỉ -->
        <div class="border-bottom pb-4">
          <h5 class="mb-3">Thông tin địa chỉ</h5>
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label for="tenKhachHang" class="block font-bold mb-3">Tên trong địa chỉ</label>
              <InputText id="tenKhachHang" v-model="customer.diaChi.tenKhachHang" placeholder="Tên trong địa chỉ..." fluid />
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label for="tenPhuong" class="block font-bold mb-3">Phường/Xã *</label>
                <InputText id="tenPhuong" v-model="customer.diaChi.tenPhuong" placeholder="Tên phường/xã" :invalid="submitted && !customer.diaChi.tenPhuong" fluid />
                <small v-if="submitted && !customer.diaChi.tenPhuong" class="text-red-500">Phường/xã là bắt buộc.</small>
              </div>
              <div>
                <label for="tenHuyen" class="block font-bold mb-3">Quận/Huyện *</label>
                <InputText id="tenHuyen" v-model="customer.diaChi.tenHuyen" placeholder="Tên quận/huyện" :invalid="submitted && !customer.diaChi.tenHuyen" fluid />
                <small v-if="submitted && !customer.diaChi.tenHuyen" class="text-red-500">Quận/huyện là bắt buộc.</small>
              </div>
              <div>
                <label for="tenTinh" class="block font-bold mb-3">Tỉnh/Thành phố *</label>
                <InputText id="tenTinh" v-model="customer.diaChi.tenTinh" placeholder="Tên tỉnh/thành phố" :invalid="submitted && !customer.diaChi.tenTinh" fluid />
                <small v-if="submitted && !customer.diaChi.tenTinh" class="text-red-500">Tỉnh/thành phố là bắt buộc.</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Trạng thái -->
        <div>
          <label for="trangThai" class="block font-bold mb-3">Trạng thái *</label>
          <Select id="trangThai" v-model="customer.trangThai" :options="statusOptions.slice(1)" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" :invalid="submitted && customer.trangThai === undefined" fluid />
          <small v-if="submitted && customer.trangThai === undefined" class="text-red-500">Trạng thái là bắt buộc.</small>
        </div>
      </div>
      <template #footer>
        <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" :disabled="saving" />
        <Button label="Cập nhật" icon="pi pi-check" @click="saveCustomer" :loading="saving" />
      </template>
    </Dialog>

    <!-- Delete Dialogs -->
    <Dialog v-model:visible="deleteCustomerDialog" :style="{ width: '450px' }" header="Xác nhận xóa" :modal="true">
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span v-if="customer">Bạn có chắc chắn muốn xóa khách hàng <b>{{ customer.hoTen }}</b>?</span>
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
        <Button label="Có" icon="pi pi-check" text @click="deleteSelectedCustomers" :loading="deleting" />
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

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);

async function generateCustomerCode() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  let suffix = 1;
  let newCode = `KH-${dateStr}-${String(suffix).padStart(3, '0')}`;

  try {
    while (true) {
      const res = await axios.get(`http://localhost:8080/khach-hang/check-code?code=${newCode}`, { timeout: 5000 });
      if (res.data.available) break;
      suffix++;
      newCode = `KH-${dateStr}-${String(suffix).padStart(3, '0')}`;
    }
    return newCode;
  } catch (error) {
    console.error('Error generating customer code:', error);
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tạo mã khách hàng', life: 3000 });
    return null;
  }
}

onMounted(() => {
  fetchData();
});

async function fetchData() {
  isLoading.value = true;
  try {
    const res = await axios.get('http://localhost:8080/khach-hang', { timeout: 10000 });
    customers.value = res.data.map(cust => ({
      ...cust,
      diaChi: cust.diaChi || { tenKhachHang: '', tenPhuong: '', tenHuyen: '', tenTinh: '' },
      viDiem: cust.viDiem || { diemHienTai: 0, tongDiemDaDung: 0, tongDiemTichLuy: 0, trangThai: 1 }
    }));
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi tải dữ liệu khách hàng', life: 3000 });
  } finally {
    isLoading.value = false;
  }
}

const filteredCustomers = computed(() => {
  let filtered = customers.value;
  if (statusFilter.value !== '') {
    filtered = filtered.filter((cust) => cust.trangThai === parseInt(statusFilter.value));
  }
  return filtered;
});

function viewCustomer(cust) {
  viewingCustomer.value = { ...cust, diaChi: cust.diaChi || { tenKhachHang: '', tenPhuong: '', tenHuyen: '', tenTinh: '' } };
  viewDialog.value = true;
}

function editFromView() {
  customer.value = { ...viewingCustomer.value, trangThai: viewingCustomer.value.trangThai ?? 1 };
  viewDialog.value = false;
  customerDialog.value = true;
}

async function editCustomer(cust) {
  customer.value = { ...cust, trangThai: cust.trangThai ?? 1, diaChi: cust.diaChi || { tenKhachHang: '', tenPhuong: '', tenHuyen: '', tenTinh: '' } };
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

  if (
    !customer.value.hoTen?.trim() ||
    !customer.value.email?.trim() ||
    !isValidEmail(customer.value.email) ||
    !customer.value.sdt?.trim() ||
    !isValidPhone(customer.value.sdt) ||
    !customer.value.diaChi?.tenPhuong?.trim() ||
    !customer.value.diaChi?.tenHuyen?.trim() ||
    !customer.value.diaChi?.tenTinh?.trim() ||
    customer.value.trangThai === undefined
  ) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng điền đầy đủ và đúng định dạng thông tin bắt buộc', life: 3000 });
    saving.value = false;
    return;
  }

  try {
    if (!customer.value.maKhachHang) {
      const newCode = await generateCustomerCode();
      if (!newCode) {
        saving.value = false;
        return;
      }
      customer.value.maKhachHang = newCode;
    }

    let addressId = customer.value.diaChi.id;
    if (!addressId) {
      const addressRes = await axios.post('http://localhost:8080/api/dia-chi', customer.value.diaChi, { timeout: 5000 });
      addressId = addressRes.data.id;
    } else {
      await axios.put(`http://localhost:8080/api/dia-chi/${addressId}`, customer.value.diaChi, { timeout: 5000 });
    }

    const customerData = {
      ...customer.value,
      diaChi: addressId
    };

    if (customer.value.id) {
      await axios.put(`http://localhost:8080/khach-hang/${customer.value.id}`, customerData, { timeout: 5000 });
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật khách hàng thành công', life: 3000 });
    } else {
      await axios.post('http://localhost:8080/khach-hang', customerData, { timeout: 5000 });
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Thêm khách hàng thành công', life: 3000 });
    }

    await fetchData();
    hideDialog();
  } catch (error) {
    console.error('Error saving customer:', error);
    if (error.response?.status === 409) {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Email hoặc mã khách hàng đã tồn tại', life: 3000 });
    } else {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: `Lưu khách hàng thất bại: ${error.message}`, life: 5000 });
    }
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
    await axios.delete(`http://localhost:8080/khach-hang/${customer.value.id}`, { timeout: 5000 });
    await fetchData();
    deleteCustomerDialog.value = false;
    customer.value = {};
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa khách hàng thành công', life: 3000 });
  } catch (error) {
    console.error('Error deleting customer:', error);
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Xóa khách hàng thất bại', life: 3000 });
  } finally {
    deleting.value = false;
  }
}

async function changeStatus(cust) {
  try {
    const newStatus = cust.trangThai === 1 ? 0 : 1;
    await axios.put(`http://localhost:8080/khach-hang/${cust.id}`, { ...cust, trangThai: newStatus }, { timeout: 5000 });
    await fetchData();
    toast.add({ severity: 'success', summary: 'Thành công', detail: `Đã ${newStatus === 1 ? 'kích hoạt' : 'ngưng'} khách hàng`, life: 3000 });
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
      await axios.delete(`http://localhost:8080/khach-hang/${cust.id}`, { timeout: 5000 });
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

    const headers = ['ID', 'Mã Khách Hàng', 'Họ Tên', 'Email', 'SĐT', 'Địa Chỉ', 'Điểm Hiện Tại', 'Trạng Thái', 'Ngày Tạo'];
    const csvData = customers.value.map(item => [
      item.id || '',
      item.maKhachHang || '',
      item.hoTen || '',
      item.email || '',
      item.sdt || '',
      formatFullAddress(item.diaChi) || '',
      item.viDiem?.diemHienTai || 0,
      item.trangThai === 1 ? 'Hoạt động' : 'Ngừng hoạt động',
      formatDate(item.ngayTao)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

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

function formatFullAddress(diaChi) {
  if (!diaChi || (!diaChi.tenPhuong && !diaChi.tenHuyen && !diaChi.tenTinh)) return 'Chưa cập nhật địa chỉ';
  return [diaChi.tenPhuong, diaChi.tenHuyen, diaChi.tenTinh].filter(part => part?.trim()).join(', ');
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString('vi-VN') : '';
}

function getInitials(name) {
  return name ? name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2) : '';
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
