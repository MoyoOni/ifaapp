export enum AdminSubRole {
  // Financial operations
  FINANCE = 'FINANCE',
  
  // Content and user moderation
  MODERATOR = 'MODERATOR',
  
  // Compliance and verification
  COMPLIANCE = 'COMPLIANCE',
  
  // User support operations
  SUPPORT = 'SUPPORT',
  
  // Safeguarding concerns and crisis flags (docs/safeguarding, SAFE-03):
  // the only sub-role besides SUPER that may read them.
  SAFEGUARDING = 'SAFEGUARDING',

  // Super admin with all permissions
  SUPER = 'SUPER',
}