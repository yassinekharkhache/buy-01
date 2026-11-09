import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowseProducts } from './browse-products';

describe('BrowseProducts', () => {
  let component: BrowseProducts;
  let fixture: ComponentFixture<BrowseProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowseProducts],
    }).compileComponents();

    fixture = TestBed.createComponent(BrowseProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
