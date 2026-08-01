import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SubscriptionComponent } from './subscription.component';
import { AuthService, AuthUser } from '../../../core/services/auth.service';
import { MarketDataService } from '../../../core/services/market-data.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

const FREE_USER: AuthUser = { id: '123', email: 'free@test.com', name: 'Free', role: 'user' };
const PRO_USER: AuthUser = { id: '124', email: 'pro@test.com', name: 'Pro', role: 'pro' };

describe('SubscriptionComponent', () => {
  let component: SubscriptionComponent;
  let authService: jasmine.SpyObj<AuthService>;

  function build(authUser: AuthUser | null) {
    authService = jasmine.createSpyObj('AuthService', [], { currentUser: authUser });
    TestBed.configureTestingModule({
      declarations: [SubscriptionComponent],
      imports: [TranslateModule.forRoot()],
      providers: [
        MarketDataService,
        { provide: AuthService, useValue: authService },
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => key,
            get: (key: string) => key,
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    const fixture = TestBed.createComponent(SubscriptionComponent);
    component = fixture.componentInstance;
  }

  it('should create', () => {
    build(FREE_USER);
    expect(component).toBeTruthy();
  });

  it('should define a Free and a Pro plan', () => {
    build(FREE_USER);
    const names = component.plans.map((p) => p.name);
    expect(names).toContain('SUBSCRIPTION.PLAN_FREE');
    expect(names).toContain('SUBSCRIPTION.PLAN_PRO');
    expect(component.plans.find((p) => p.name === 'SUBSCRIPTION.PLAN_PRO')?.highlight).toBeTrue();
  });

  it('should expose ticker items from market data indices', () => {
    build(FREE_USER);
    const marketData = TestBed.inject(MarketDataService);
    expect(component.tickerItems.length).toBe(marketData.indices.length);
    expect(component.tickerItems[0].symbol).toBe(marketData.indices[0].name);
  });

  it('should report Free plan for a free user', () => {
    build(FREE_USER);
    expect(component.isPro).toBeFalse();
    expect(component.currentPlanName).toBe('SUBSCRIPTION.PLAN_FREE');
  });

  it('should report Pro plan for a pro user', () => {
    build(PRO_USER);
    expect(component.isPro).toBeTrue();
    expect(component.currentPlanName).toBe('SUBSCRIPTION.QUANTORA_PRO');
  });
});
