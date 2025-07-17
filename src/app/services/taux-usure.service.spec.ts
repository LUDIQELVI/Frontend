import { TestBed } from '@angular/core/testing';

import { TauxUsureService } from './taux-usure.service';

describe('TauxUsureService', () => {
  let service: TauxUsureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TauxUsureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
