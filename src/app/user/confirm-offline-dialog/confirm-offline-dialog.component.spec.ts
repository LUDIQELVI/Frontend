import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmOfflineDialogComponent } from './confirm-offline-dialog.component';

describe('ConfirmOfflineDialogComponent', () => {
  let component: ConfirmOfflineDialogComponent;
  let fixture: ComponentFixture<ConfirmOfflineDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmOfflineDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmOfflineDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
