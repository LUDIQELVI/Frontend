import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeConnecteeComponent } from './home-connectee.component';

describe('HomeConnecteeComponent', () => {
  let component: HomeConnecteeComponent;
  let fixture: ComponentFixture<HomeConnecteeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeConnecteeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeConnecteeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
