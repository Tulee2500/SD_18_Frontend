// import { defineStore } from 'pinia';
// import { router } from '@/router';
// import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

// const baseUrl = `${import.meta.env.VITE_API_URL}/auth`;

// export const useAuthStore = defineStore({
//   id: 'auth',
//   state: () => ({
//     user: JSON.parse(localStorage.getItem('user') || null,
//     returnUrl: null
//   }),
//   actions: {
//     async login(email: string, password: string) {
//       const res = await fetchWrapper.post(`${baseUrl}/login`, { email, matKhau: password });
      
//       if (!res.success) {
//         // Trả về message cụ thể từ server
//         throw res.message || 'Email hoặc mật khẩu không đúng!';
//       }

//       // Lưu thông tin user
//       this.user = res.data;
//       localStorage.setItem('user', JSON.stringify(res.data));
      
//       return res.data;
//     },
//     logout() {
//       this.user = null;
//       localStorage.removeItem('user');
//       router.push('/login');
//     }
//   }
// });