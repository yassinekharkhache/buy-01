import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WishListApi } from './wish-list-api';

describe('WishListApi', () => {
  let component: WishListApi;
  let fixture: ComponentFixture<WishListApi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WishListApi],
    }).compileComponents();

    fixture = TestBed.createComponent(WishListApi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
