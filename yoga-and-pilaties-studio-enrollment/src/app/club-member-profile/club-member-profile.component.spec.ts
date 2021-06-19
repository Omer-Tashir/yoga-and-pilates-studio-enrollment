import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubMemberProfileComponent } from './club-member-profile.component';

describe('ClubMemberProfileComponent', () => {
  let component: ClubMemberProfileComponent;
  let fixture: ComponentFixture<ClubMemberProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClubMemberProfileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClubMemberProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
