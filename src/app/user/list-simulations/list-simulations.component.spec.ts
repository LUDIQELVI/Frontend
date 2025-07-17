import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListSimulationsComponent } from './list-simulations.component';

describe('ListSimulationsComponent', () => {
  let component: ListSimulationsComponent;
  let fixture: ComponentFixture<ListSimulationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSimulationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListSimulationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
