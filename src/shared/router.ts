import Vue from 'vue';
import Router, { Route } from 'vue-router';

import {store, bus, log} from './index';

import { Forbidden } from '@servicestack/vue';
import { Home } from '../components/Home';
import { AutoQuery } from '../components/AutoQuery';
import { Validation } from '../components/Validation';
import { AdminUsers } from '../components/AdminUsers';
import {appendQueryString} from '@servicestack/client';

export enum Routes {
  Home = '/',
  AutoQuery = '/:slug/autoquery',
  Validation = '/:slug/validation',
  AdminUsers = '/:slug/users',
  Forbidden = '/forbidden',
}

Vue.use(Router);

function requiresAuth(to: Route, from: Route, next: (to?: string) => void) {
  if (!store.userSession) {
    //next(`${Routes.SignIn}?redirect=${encodeURIComponent(to.path)}`);
    return;
  }
  next();
}

function requiresRole(role: string) {
  return (to: Route, from: Route, next: (to?: string) => void) => {
    if (!store.userSession) {
      //next(`${Routes.SignIn}?redirect=${encodeURIComponent(to.path)}`);
    }
    else if (!store.userSession.roles || store.userSession.roles.indexOf(role) < 0) {
      next(`${Routes.Forbidden}?role=${encodeURIComponent(role)}`);
    }
    else {
      next();
    }
  };
}

const routes = [
  { path: Routes.Home, component: Home, props: { name: '' } },
  { path: Routes.AutoQuery, component: AutoQuery },
  { path: Routes.Validation, component: Validation },
  { path: Routes.AdminUsers, component: AdminUsers },
  { path: Routes.Forbidden, component: Forbidden },
  { path: '*', redirect: '/' },
];

export const autoQueryRoute = (slug:string,args?:any) => appendQueryString(Routes.AutoQuery.replace(':slug',slug), args);
export const validationRoute = (slug:string,args?:any) => appendQueryString(Routes.Validation.replace(':slug',slug), args);
export const adminUsersRoute = (slug:string,args?:any) => appendQueryString(Routes.AdminUsers.replace(':slug',slug), args);

export const router = new Router ({
    mode: 'history',
    linkActiveClass: 'active',
    routes,
});
export default router;

export const redirect = (path: string) => {
  log('redirect', path);
  const externalUrl = path.indexOf('://') >= 0;
  if (!externalUrl) {
      router.push({ path });
  } else {
      location.href = path;
  }
};
