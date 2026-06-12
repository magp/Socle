import { initTheme } from '../_lib/core/theme/theme.js';
import './strings.js';
import { setLocale, getLocale } from '../_lib/core/strings.js';
%%STORE_IMPORT%%
%%REDUCER_IMPORT%%
import '../_lib/core/router/app-router.js';
import '../_lib/core/sw-manager/sw-manager.js';
import '../_lib/core/components/update-banner/update-banner.js';
%%APP_HEADER_IMPORT%%
%%MODAL_IMPORT%%
import './pages/home-page.js';
import './pages/not-found-page.js';
%%IMAGES_IMPORT%%

initTheme();
setLocale(getLocale());

%%STORE_BOOT%%

console.log('%%APP_NAME%%', __APP_VERSION__);

const router = document.querySelector('app-router');
router.routes = [
  { path: '/', component: 'home-page' },
  %%IMAGES_ROUTE%%
  { path: '*', component: 'not-found-page' },
];
