<template>
  <div class="card">
    <Toast />
    <Toolbar class="mb-4">
      <template #start>
        <Button label="Thêm mới" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" :loading="loading" />
        <Button label="Xóa" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedVouchers || !selectedVouchers.length" :loading="loading" />
      </template>
      <template #end>
        <Button label="Xuất CSV" icon="pi pi-upload" severity="primary" @click="exportCSV" :loading="loading" />
      </template>
    </Toolbar>

    <DataTable
      ref="dt"
      v-model:selection="selectedVouchers"
      :value="vouchers"
      dataKey="id"
      :paginator="true"
      :rows="10"
      :filters="filters"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[5, 10, 25]"
      currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} voucher"
    >
      <template #header>
        <div class="flex flex-wrap gap-2 items-center justify-between">
          <h4 class="m-0">📦 Quản lý Voucher</h4>
          <IconField>
            <InputIcon>
              <i class="pi pi-search" />
            </InputIcon>
            <InputText v-model="filters['global'].value" placeholder="Tìm kiếm..." />
          </IconField>
        </div>
      </template>

      <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
      <Column field="id" header="ID" sortable style="min-width: 8rem"></Column>
      <Column field="maVoucher" header="Mã Voucher" sortable style="min-width: 12rem"></Column>
      <Column field="tenVoucher" header="Tên Voucher" sortable style="min-width: 16rem"></Column>
      <Column field="duongDanHinhAnh" header="Hình ảnh" style="min-width: 10rem">
        <template #body="slotProps">
          <img v-if="slotProps.data.duongDanHinhAnh" :src="slotProps.data.duongDanHinhAnh" :alt="slotProps.data.tenVoucher" class="w-16 h-16 object-cover" />
        </template>
      </Column>
      <Column field="loaiGiamGia" header="Loại giảm giá" sortable style="min-width: 12rem"></Column>
      <Column field="giaTriGiamToiThieu" header="Giảm tối thiểu" sortable style="min-width: 12rem">
        <template #body="slotProps">
          {{ formatCurrency(slotProps.data.giaTriGiamToiThieu) }}
        </template>
      </Column>
      <Column field="giaTriGiamToiDa" header="Giảm tối đa" sortable style="min-width: 12rem">
        <template #body="slotProps">
          {{ formatCurrency(slotProps.data.giaTriGiamToiDa) }}
        </template>
      </Column>
      <Column field="soLuong" header="Số lượng" sortable style="min-width: 10rem"></Column>
      <Column field="ngayBatDau" header="Ngày bắt đầu" sortable style="min-width: 12rem">
        <template #body="slotProps">
          {{ formatDate(slotProps.data.ngayBatDau) }}
        </template>
      </Column>
      <Column field="ngayKetThuc" header="Ngày kết thúc" sortable style="min-width: 12rem">
        <template #body="slotProps">
          {{ formatDate(slotProps.data.ngayKetThuc) }}
        </template>
      </Column>
      <Column field="trangThai" header="Trạng thái" sortable style="min-width: 12rem">
        <template #body="slotProps">
          <Tag :value="slotProps.data.trangThai === 1 ? 'Còn hạn' : 'Hết hạn'" :severity="getStatusLabel(slotProps.data.trangThai)" />
        </template>
      </Column>
      <Column :exportable="false" style="width: 10rem">
        <template #body="slotProps">
          <div class="flex justify-between gap-2">
            <Button icon="pi pi-pencil" outlined rounded size="small" @click="editVoucher(slotProps.data)" :disabled="loading" />
            <Button icon="pi pi-trash" outlined rounded severity="danger" size="small" @click="confirmDeleteVoucher(slotProps.data)" :disabled="loading" />
            <Button icon="pi pi-refresh" outlined rounded severity="secondary" size="small" @click="changeStatus(slotProps.data)" :disabled="loading" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="voucherDialog" :style="{ width: '450px' }" header="Chi tiết Voucher" :modal="true">
      <div class="flex flex-col gap-6">
        <div>
          <label for="maVoucher" class="block font-bold mb-3">Mã Voucher</label>
          <InputText id="maVoucher" v-model.trim="voucher.maVoucher" required="true" autofocus :invalid="submitted && !voucher.maVoucher" fluid readonly="true" />
          <small v-if="submitted && !voucher.maVoucher" class="text-red-500">Mã Voucher là bắt buộc.</small>
        </div>
        <div>
          <label for="tenVoucher" class="block font-bold mb-3">Tên Voucher</label>
          <InputText id="tenVoucher" v-model.trim="voucher.tenVoucher" required="true" :invalid="submitted && !voucher.tenVoucher" fluid />
          <small v-if="submitted && !voucher.tenVoucher" class="text-red-500">Tên Voucher là bắt buộc.</small>
        </div>
        <div>
          <label for="duongDanHinhAnh" class="block font-bold mb-3">Đường dẫn hình ảnh</label>
          <InputText id="duongDanHinhAnh" v-model="voucher.duongDanHinhAnh" fluid />
        </div>
        <div>
          <label for="loaiGiamGia" class="block font-bold mb-3">Loại giảm giá</label>
          <Select id="loaiGiamGia" v-model="voucher.loaiGiamGia" :options="discountTypes" optionLabel="label" optionValue="value" placeholder="Chọn loại giảm giá" fluid :invalid="submitted && !voucher.loaiGiamGia" />
          <small v-if="submitted && !voucher.loaiGiamGia" class="text-red-500">Loại giảm giá là bắt buộc.</small>
        </div>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-6">
            <label for="giaTriGiamToiThieu" class="block font-bold mb-3">Giảm tối thiểu</label>
            <InputText id="giaTriGiamToiThieu" v-model.number="voucher.giaTriGiamToiThieu" mode="currency" currency="VND" locale="vi-VN" fluid :min="0" :invalid="submitted && (voucher.giaTriGiamToiThieu == null || voucher.giaTriGiamToiThieu < 0)" />
            <small v-if="submitted && (voucher.giaTriGiamToiThieu == null || voucher.giaTriGiamToiThieu < 0)" class="text-red-500">Giá trị giảm tối thiểu không hợp lệ.</small>
          </div>
          <div class="col-span-6">
            <label for="giaTriGiamToiDa" class="block font-bold mb-3">Giảm tối đa</label>
            <InputText id="giaTriGiamToiDa" v-model.number="voucher.giaTriGiamToiDa" mode="currency" currency="VND" locale="vi-VN" fluid :min="0" :invalid="submitted && (voucher.giaTriGiamToiDa == null || voucher.giaTriGiamToiDa < 0)" />
            <small v-if="submitted && (voucher.giaTriGiamToiDa == null || voucher.giaTriGiamToiDa < 0)" class="text-red-500">Giá trị giảm tối đa không hợp lệ.</small>
          </div>
        </div>
        <div>
          <label for="soLuong" class="block font-bold mb-3">Số lượng</label>
          <InputText id="soLuong" v-model.number="voucher.soLuong" fluid :min="0" :invalid="submitted && (voucher.soLuong == null || voucher.soLuong < 0)" />
          <small v-if="submitted && (voucher.soLuong == null || voucher.soLuong < 0)" class="text-red-500">Số lượng không hợp lệ.</small>
        </div>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-6">
            <label for="ngayBatDau" class="block font-bold mb-3">Ngày bắt đầu</label>
            <Calendar id="ngayBatDau" v-model="voucher.ngayBatDau" showIcon fluid dateFormat="dd/mm/yy" :invalid="submitted && !voucher.ngayBatDau" />
            <small v-if="submitted && !voucher.ngayBatDau" class="text-red-500">Ngày bắt đầu là bắt buộc.</small>
          </div>
          <div class="col-span-6">
            <label for="ngayKetThuc" class="block font-bold mb-3">Ngày kết thúc</label>
            <Calendar id="ngayKetThuc" v-model="voucher.ngayKetThuc" showIcon fluid dateFormat="dd/mm/yy" :invalid="submitted && !voucher.ngayKetThuc" />
            <small v-if="submitted && !voucher.ngayKetThuc" class="text-red-500">Ngày kết thúc là bắt buộc.</small>
          </div>
        </div>
        <div>
          <label for="trangThai" class="block font-bold mb-3">Trạng thái</label>
          <Select id="trangThai" v-model="voucher.trangThai" :options="statuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" fluid :invalid="submitted && voucher.trangThai == null" />
          <small v-if="submitted && voucher.trangThai == null" class="text-red-500">Trạng thái là bắt buộc.</small>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" :disabled="loading" />
        <Button label="Lưu" icon="pi pi-check" @click="saveVoucher" :loading="loading" />
      </template>
    </Dialog>

    <Dialog v-model:visible="deleteVoucherDialog" :style="{ width: '450px' }" header="Xác nhận" :modal="true">
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
        <span v-if="voucher">Bạn có chắc muốn xóa voucher <b>{{ voucher.tenVoucher }}</b>?</span>
      </div>
      <template #footer>
        <Button label="Không" icon="pi pi-times" text @click="deleteVoucherDialog = false" :disabled="loading" />
        <Button label="Có" icon="pi pi-check" severity="danger" @click="deleteVoucher" :loading="loading" />
      </template>
    </Dialog>

    <Dialog v-model:visible="deleteVouchersDialog" :style="{ width: '450px' }" header="Xác nhận" :modal="true">
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
        <span>Bạn có chắc muốn xóa các voucher đã chọn?</span>
      </div>
      <template #footer>
        <Button label="Không" icon="pi pi-times" text @click="deleteVouchersDialog = false" :disabled="loading" />
        <Button label="Có" icon="pi pi-check" severity="danger" @click="deleteSelectedVouchers" :loading="loading" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';

const toast = useToast();
const dt = ref();
const vouchers = ref([]); // Đổi tên ListVoucher thành vouchers cho rõ ràng
const voucherDialog = ref(false);
const deleteVoucherDialog = ref(false);
const deleteVouchersDialog = ref(false);
const voucher = ref({});
const selectedVouchers = ref();
const submitted = ref(false);
const loading = ref(false); // Thêm trạng thái loading
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const statuses = ref([
  { label: 'Còn hạn', value: 1 },
  { label: 'Hết hạn', value: 0 }
]);
const discountTypes = ref([
  { label: 'Phần trăm', value: 'PERCENTAGE' },
  { label: 'Số tiền cố định', value: 'FIXED_AMOUNT' }
]);

onMounted(() => {
  fetchData();
});

async function fetchData() {
  try {
    loading.value = true;
    const res = await axios.get('http://localhost:8080/voucher');
    vouchers.value = res.data.map(item => ({
      ...item,
      ngayBatDau: item.ngayBatDau ? new Date(item.ngayBatDau) : null,
      ngayKetThuc: item.ngayKetThuc ? new Date(item.ngayKetThuc) : null
    }));
  } catch (error) {
    console.error('Lỗi khi tải voucher:', error);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể tải danh sách voucher',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
}

function formatCurrency(value) {
  if (value != null) return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  return '0 ₫';
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function createId() {
  let id = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'V' + id;
}
function openNew() {
  voucher.value = {
    maVoucher: createId(),
    tenVoucher: '',
    duongDanHinhAnh: '',
    loaiGiamGia: null,
    giaTriGiamToiThieu: 0,
    giaTriGiamToiDa: 0,
    soLuong: 0,
    ngayBatDau: null,
    ngayKetThuc: null,
    trangThai: 1
  };
  submitted.value = false;
  voucherDialog.value = true;
}

function hideDialog() {
  voucherDialog.value = false;
  submitted.value = false;
  voucher.value = {};
}

async function saveVoucher() {
  submitted.value = true;

  // Check trống các trường dữ liệu bắt buộc
  if (!voucher.value.maVoucher?.trim()) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Mã voucher là bắt buộc', life: 3000 });
    return;
  }
  if (!voucher.value.tenVoucher?.trim()) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Tên voucher là bắt buộc', life: 3000 });
    return;
  }
  if (!voucher.value.loaiGiamGia) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Loại giảm giá là bắt buộc', life: 3000 });
    return;
  }
  if (!voucher.value.giaTriGiamToiThieu  || voucher.value.giaTriGiamToiThieu < 0) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Giá trị giảm tối thiểu không hợp lệ', life: 3000 });
    return;
  }
  if (!voucher.value.giaTriGiamToiDa || voucher.value.giaTriGiamToiDa < 0) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Giá trị giảm tối đa không hợp lệ', life: 3000 });
    return;
  }
  if (!voucher.value.soLuong || voucher.value.soLuong < 0) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Số lượng không hợp lệ', life: 3000 });
    return;
  }
  if (!voucher.value.ngayBatDau) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Ngày bắt đầu là bắt buộc', life: 3000 });
    return;
  }
  if (!voucher.value.ngayKetThuc) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Ngày kết thúc là bắt buộc', life: 3000 });
    return;
  }
  
  // Validation: Kiểm tra ngày bắt đầu phải trước ngày kết thúc
  if (new Date(voucher.value.ngayBatDau) >= new Date(voucher.value.ngayKetThuc)) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Cảnh báo', 
      detail: 'Ngày bắt đầu phải trước ngày kết thúc', 
      life: 3000 
    });
    return;
  }
  
  if (voucher.value.trangThai == null) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Trạng thái là bắt buộc', life: 3000 });
    return;
  }

  try {
    loading.value = true;
    const voucherData = {
      ...voucher.value,
      ngayBatDau: new Date(voucher.value.ngayBatDau).toISOString().split('T')[0],
      ngayKetThuc: new Date(voucher.value.ngayKetThuc).toISOString().split('T')[0]
    };

    if (voucher.value.id) {
      await axios.put(`http://localhost:8080/voucher/${voucher.value.id}`, voucherData);
      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Cập nhật voucher thành công',
        life: 3000
      });
    } else {
      voucherData.maVoucher = voucherData.maVoucher || createId();
      await axios.post('http://localhost:8080/voucher', voucherData);
      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Tạo voucher thành công',
        life: 3000
      });
    }
    await fetchData();
    voucherDialog.value = false;
    voucher.value = {};
  } catch (error) {
    console.error('Lỗi khi lưu voucher:', error.response?.data, error.response?.status);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: `Lưu voucher thất bại: ${error.response?.data?.message || error.message}`,
      life: 3000
    });
  } finally {
    loading.value = false;
    submitted.value = false;
  }
}
function editVoucher(vouch) {
  voucher.value = {
    ...vouch,
    giaTriGiamToiThieu: vouch.giaTriGiamToiThieu ?? 0,
    giaTriGiamToiDa: vouch.giaTriGiamToiDa ?? 0,
    soLuong: vouch.soLuong ?? 0,
    ngayBatDau: vouch.ngayBatDau ? new Date(vouch.ngayBatDau) : null,
    ngayKetThuc: vouch.ngayKetThuc ? new Date(vouch.ngayKetThuc) : null,
    trangThai: vouch.trangThai ?? 1
  };
  submitted.value = false;
  voucherDialog.value = true;
}

function confirmDeleteVoucher(vouch) {
  voucher.value = vouch;
  deleteVoucherDialog.value = true;
}

async function deleteVoucher() {
  try {
    loading.value = true;
    await axios.delete(`http://localhost:8080/voucher/${voucher.value.id}`);
    await fetchData();
    deleteVoucherDialog.value = false;
    voucher.value = {};
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Xóa voucher thành công',
      life: 3000
    });
  } catch (error) {
    console.error('Lỗi khi xóa voucher:', error);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Xóa voucher thất bại',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
}

function confirmDeleteSelected() {
  deleteVouchersDialog.value = true;
}

async function deleteSelectedVouchers() {
  try {
    loading.value = true;
    for (const vouch of selectedVouchers.value) {
      await axios.delete(`http://localhost:8080/voucher/${vouch.id}`);
    }
    await fetchData();
    deleteVouchersDialog.value = false;
    selectedVouchers.value = null;
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Xóa các voucher thành công',
      life: 3000
    });
  } catch (error) {
    console.error('Lỗi khi xóa nhiều voucher:', error);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Xóa các voucher thất bại',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
}

async function changeStatus(vouch) {
  try {
    loading.value = true;
    const updatedVoucher = { ...vouch, trangThai: vouch.trangThai === 1 ? 0 : 1 };
    await axios.put(`http://localhost:8080/voucher/${vouch.id}`, updatedVoucher);
    await fetchData();
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Cập nhật trạng thái thành công',
      life: 3000
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái:', error);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Cập nhật trạng thái thất bại',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
}

function getStatusLabel(status) {
  return status === 1 ? 'success' : 'danger';
}

function exportCSV() {
  try {
    if (!vouchers.value || vouchers.value.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Không có dữ liệu để xuất',
        life: 3000
      });
      return;
    }

    const headers = ['ID', 'Mã Voucher', 'Tên Voucher', 'Hình Ảnh', 'Loại giảm giá', 'Giảm tối thiểu', 'Giảm tối đa', 'Số lượng', 'Ngày Bắt Đầu', 'Ngày Kết Thúc', 'Trạng Thái'];

    const csvData = vouchers.value.map(item => [
      item.id || '',
      item.maVoucher || '',
      item.tenVoucher || '',
      item.duongDanHinhAnh || '',
      item.loaiGiamGia || '',
      item.giaTriGiamToiThieu || 0,
      item.giaTriGiamToiDa || 0,
      item.soLuong || 0,
      formatDate(item.ngayBatDau) || '',
      formatDate(item.ngayKetThuc) || '',
      item.trangThai === 1 ? 'Còn hạn' : 'Hết hạn'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => {
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(','))
      .join('\n');

    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `Voucher-${dateStr}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: `Đã xuất ${vouchers.value.length} bản ghi ra file CSV`,
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
</script>

<style scoped>
.card {
  background: var(--surface-card);
  padding: 2rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}
</style>