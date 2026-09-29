import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedCollection } from './shared-collection';

describe('SharedCollection', () => {
  let component: SharedCollection;
  let fixture: ComponentFixture<SharedCollection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedCollection],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedCollection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
