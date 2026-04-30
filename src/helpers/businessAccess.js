export function canAccessBusinessDashboard(profile) {
  if (!profile) return false;
  // If god_admin or admin, allow
  if (profile.role === 'god_admin' || profile.role === 'admin') return true;
  // Business logic
  return profile.business_access === true && profile.business_status === 'approved' && profile.account_type === 'business';
}
