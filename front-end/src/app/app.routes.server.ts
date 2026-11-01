import { RenderMode, ServerRoute } from '@angular/ssr';

// choosing the rendring mode
// RenderMode.Prerender for static pages like (login) (Rag) (About)
// RenderMode.Server = SSR
// RenderMode.Client = CSR
export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Prerender
  },
  {
    path: "**",
    renderMode: RenderMode.Client
  }
];