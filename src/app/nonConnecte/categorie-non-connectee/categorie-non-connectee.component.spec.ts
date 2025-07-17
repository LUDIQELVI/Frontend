import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategorieNonConnecteeComponent } from './categorie-non-connectee.component';

describe('CategorieNonConnecteeComponent', () => {
  let component: CategorieNonConnecteeComponent;
  let fixture: ComponentFixture<CategorieNonConnecteeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategorieNonConnecteeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategorieNonConnecteeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
