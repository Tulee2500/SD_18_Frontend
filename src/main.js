import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import './style.css';
import '@/assets/styles.scss';
import { MotionPlugin } from '@vueuse/motion';
// import VueSmoothScroll from "v-smooth-scroll"; // Comment out dòng này

const app = createApp(App);

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
app.use(MotionPlugin);
// .use(VueSmoothScroll,{
//     duration: 2000,
// }) // Comment out đoạn này

app.mount('#app');
