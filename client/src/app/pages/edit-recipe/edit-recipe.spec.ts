import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';

import { EditRecipe } from './edit-recipe';

describe('EditRecipe', () => {
  let component: EditRecipe;
  let fixture: ComponentFixture<EditRecipe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditRecipe],
      providers: [
        provideRouter([]),
        provideToastr(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditRecipe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});