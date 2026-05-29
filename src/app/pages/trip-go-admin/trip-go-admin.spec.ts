import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripGoAdmin } from './trip-go-admin';

describe('TripGoAdmin', () => {
  let component: TripGoAdmin;
  let fixture: ComponentFixture<TripGoAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripGoAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripGoAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
