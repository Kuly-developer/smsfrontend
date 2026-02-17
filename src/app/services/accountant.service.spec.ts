import { TestBed } from '@angular/core/testing';

import { AccountantService } from './accountant.service';

describe('AccountantService', () => {
  let service: AccountantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
