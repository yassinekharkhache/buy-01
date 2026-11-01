import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExplorePage } from './explore-page';

describe('ExplorePage', () => {
  let component: ExplorePage;
  let fixture: ComponentFixture<ExplorePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExplorePage],
    }).compileComponents();

    fixture = TestBed.createComponent(ExplorePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
