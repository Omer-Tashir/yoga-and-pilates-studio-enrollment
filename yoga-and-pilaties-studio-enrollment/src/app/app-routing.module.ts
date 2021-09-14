import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';

import { AuthService } from './auth/auth.service';
import { isAdminGuard, isAdminOrTeacherGuard, isMemberGuard } from './auth/auth.guard';
import { DbResolverService } from './db.resolver.service';

import { HomeComponent } from './home/home.component';
import { ClubMembersComponent } from './club-members/club-members.component';
import { ClubMemberProfileComponent } from './club-member-profile/club-member-profile.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, resolve: { loaded: DbResolverService } },
  { path: 'club-members', component: ClubMembersComponent, resolve: { loaded: DbResolverService }, canActivate: [isAdminOrTeacherGuard] },
  { path: 'club-member-profile', component: ClubMemberProfileComponent, resolve: { loaded: DbResolverService }, canActivate: [isMemberGuard]  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload', scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {
  constructor(private router: Router, private authService: AuthService) {
    this.router.errorHandler = (error: any) => {
      //this.authService.logout(error);
    };
  }
}