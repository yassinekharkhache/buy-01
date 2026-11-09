import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductApi } from './product-api';

describe('ProductApi', () => {
  let component: ProductApi;
  let fixture: ComponentFixture<ProductApi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductApi],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductApi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
