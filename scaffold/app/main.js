import './strings.js';
import { setLocale, getLocale } from '../_lib/core/strings.js';
import { boot } from '../_lib/core/store/store.js';
import { reducer } from './store/reducer.js';
import '../_lib/core/router/app-router.js';
import '../_lib/core/sw-manager/sw-manager.js';
import '../_lib/core/components/update-banner/update-banner.js';
import './pages/home-page.js';
import './pages/not-found-page.js';

setLocale(getLocale());

await boot({ dbName: '%%APP_NAME%%', reducer });

console.log('%%APP_NAME%%', __APP_VERSION__);

const router = document.querySelector('app-router');
router.routes = [
  { path: '/', component: 'home-page' },
  { path: '*', component: 'not-found-page' },
];
