import { describe, it, expect } from 'vitest';
import { canAccessBusinessDashboard } from './businessAccess';

describe('Business Access Helper', () => {
  it('should deny access if profile is undefined or null', () => {
    expect(canAccessBusinessDashboard(null)).toBe(false);
    expect(canAccessBusinessDashboard(undefined)).toBe(false);
  });

  it('should allow access for god_admin role', () => {
    const profile = { role: 'god_admin' };
    expect(canAccessBusinessDashboard(profile)).toBe(true);
  });

  it('should allow access for admin role', () => {
    const profile = { role: 'admin' };
    expect(canAccessBusinessDashboard(profile)).toBe(true);
  });

  it('should deny access for regular user', () => {
    const profile = { account_type: 'user' };
    expect(canAccessBusinessDashboard(profile)).toBe(false);
  });

  it('should deny access for business user with pending status', () => {
    const profile = {
      account_type: 'business',
      business_status: 'pending',
      business_access: false
    };
    expect(canAccessBusinessDashboard(profile)).toBe(false);
  });

  it('should deny access for business user with suspended status', () => {
    const profile = {
      account_type: 'business',
      business_status: 'suspended',
      business_access: false
    };
    expect(canAccessBusinessDashboard(profile)).toBe(false);
  });

  it('should allow access for fully approved business user', () => {
    const profile = {
      account_type: 'business',
      business_status: 'approved',
      business_access: true
    };
    expect(canAccessBusinessDashboard(profile)).toBe(true);
  });

  it('should deny access if business_access is false even if status is approved', () => {
    const profile = {
      account_type: 'business',
      business_status: 'approved',
      business_access: false
    };
    expect(canAccessBusinessDashboard(profile)).toBe(false);
  });

  it('should deny access if account_type is not business', () => {
    const profile = {
      account_type: 'user',
      business_status: 'approved',
      business_access: true
    };
    expect(canAccessBusinessDashboard(profile)).toBe(false);
  });
});
