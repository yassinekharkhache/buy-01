import { Routes } from '@angular/router';
import { LoginPage } from './pages/login-page/login-page';
import { SideBar } from './components/side-bar/side-bar';
import { MainLayout } from './main-layout/main-layout';
import { Profile } from './components/profile/profile';
import { CreateProduct } from './components/create-product/create-product';
import { BrowseProducts } from './components/browse-products/browse-products';
import { ProductPage } from './pages/product-page/product-page';
import { WishlistPage } from './pages/wishlist-page/wishlist-page';

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
      },
      {
        path: 'products',
        component: BrowseProducts
      },
      {
        path: 'products/mine',
        component: BrowseProducts
      },
      {
        path: 'products/:id',
        component: ProductPage
      },
      {
        path: 'wishlists',
        component: WishlistPage
      },
    ],
  },

];
