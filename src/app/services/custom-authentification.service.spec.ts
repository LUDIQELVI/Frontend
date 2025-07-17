import { TestBed } from '@angular/core/testing';

import { CustomAuthentificationService } from './custom-authentification.service';

describe('CustomAuthentificationService', () => {
  let service: CustomAuthentificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomAuthentificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
