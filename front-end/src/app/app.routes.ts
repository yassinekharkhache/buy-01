import { Routes } from '@angular/router';
import { LoginPage } from './pages/login-page/login-page';
import { SideBar } from './components/side-bar/side-bar';
import { MainLayout } from './main-layout/main-layout';
import { Profile } from './components/profile/profile';
import { CreateProduct } from './components/create-product/create-product';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'profile',
        component: Profile
      },
      {
        path: 'createproduct',
        component: CreateProduct
      }
    ],
  },

];
