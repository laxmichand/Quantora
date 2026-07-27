import { TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [
        FormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        MatIconModule,
        MatButtonModule,
      ],
      providers: [AuthService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty form', () => {
    expect(component.name).toBe('');
    expect(component.email).toBe('');
    expect(component.password).toBe('');
    expect(component.confirmPassword).toBe('');
  });

  it('should show error for empty fields', () => {
    component.onSubmit();
    expect(component.error).toBe('Please fill in all fields');
  });

  it('should show error for mismatched passwords', () => {
    component.name = 'Test';
    component.email = 'test@test.com';
    component.password = 'Test1234';
    component.confirmPassword = 'Different123';
    component.onSubmit();
    expect(component.error).toBe('Passwords do not match');
  });

  it('should show error for short password', () => {
    component.name = 'Test';
    component.email = 'test@test.com';
    component.password = '123';
    component.confirmPassword = '123';
    component.onSubmit();
    expect(component.error).toBe('Password must be at least 8 characters');
  });
});
