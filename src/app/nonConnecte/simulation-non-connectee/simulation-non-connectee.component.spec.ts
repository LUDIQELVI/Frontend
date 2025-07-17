import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimulationNonConnecteeComponent } from './simulation-non-connectee.component';

describe('SimulationNonConnecteeComponent', () => {
  let component: SimulationNonConnecteeComponent;
  let fixture: ComponentFixture<SimulationNonConnecteeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationNonConnecteeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimulationNonConnecteeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
