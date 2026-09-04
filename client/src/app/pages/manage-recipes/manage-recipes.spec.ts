import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageRecipes } from './manage-recipes';

describe('ManageRecipes', () => {
  let component: ManageRecipes;
  let fixture: ComponentFixture<ManageRecipes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageRecipes],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageRecipes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
