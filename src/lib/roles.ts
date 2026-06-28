/**
 * Maps an organizational role to its badge class. Mirrors the role tiers the
 * stylesheet already defines (role-leader / role-co-leader / role-officer /
 * role-expert / role-staff) so member badges pick up the right accent.
 */
export function getRoleClass(role: string) {
  const lower = role.toLowerCase()

  if (lower.includes('ketua himpunan') || lower.includes('ketua bidang')) {
    return 'role-leader'
  }

  if (lower.includes('wakil')) {
    return 'role-co-leader'
  }

  if (lower.includes('sekretaris') || lower.includes('bendahara')) {
    return 'role-officer'
  }

  if (lower.includes('staff ahli') || lower.includes('kepala biro')) {
    return 'role-expert'
  }

  return 'role-staff'
}
