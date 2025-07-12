import { ref } from 'vue';

const currentUser = ref({ id: 1, name: 'Admin', role: 'TRUONG_PHONG' });
const userName = ref('Admin');
const userRole = ref('TRUONG_PHONG');

function logout() {
  return new Promise((resolve) => {
    console.log('Logged out');
    resolve();
  });
}

export function useAuth() {
  return {
    currentUser,
    userName,
    userRole,
    logout
  };
}
