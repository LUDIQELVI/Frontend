import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuccessDialogComponentComponent } from './success-dialog-component.component';

describe('SuccessDialogComponentComponent', () => {
  let component: SuccessDialogComponentComponent;
  let fixture: ComponentFixture<SuccessDialogComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuccessDialogComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuccessDialogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
