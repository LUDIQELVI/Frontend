import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatistiqueTauxUsureComponent } from './statistique-taux-usure.component';

describe('StatistiqueTauxUsureComponent', () => {
  let component: StatistiqueTauxUsureComponent;
  let fixture: ComponentFixture<StatistiqueTauxUsureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatistiqueTauxUsureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatistiqueTauxUsureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
