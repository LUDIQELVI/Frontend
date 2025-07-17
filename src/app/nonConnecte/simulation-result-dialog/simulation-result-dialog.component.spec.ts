import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimulationResultDialogComponent } from './simulation-result-dialog.component';

describe('SimulationResultDialogComponent', () => {
  let component: SimulationResultDialogComponent;
  let fixture: ComponentFixture<SimulationResultDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationResultDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimulationResultDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
