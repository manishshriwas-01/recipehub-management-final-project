import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';

import { ViewRecipe } from './view-recipe';

describe('ViewRecipe', () => {
  let component: ViewRecipe;
  let fixture: ComponentFixture<ViewRecipe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewRecipe],
      providers: [
        provideRouter([]),
        provideToastr(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewRecipe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});