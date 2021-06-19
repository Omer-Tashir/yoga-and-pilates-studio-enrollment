import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DbResolverService } from '../db.resolver.service';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, resolve: { loaded: DbResolverService } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
