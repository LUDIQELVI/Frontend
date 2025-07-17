import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSimulationComponent } from './edit-simulation.component';

describe('EditSimulationComponent', () => {
  let component: EditSimulationComponent;
  let fixture: ComponentFixture<EditSimulationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditSimulationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditSimulationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
