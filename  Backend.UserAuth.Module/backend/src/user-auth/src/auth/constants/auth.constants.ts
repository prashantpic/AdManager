export const AuthConstants = {
  JWT_SECRET_KEY: 'JWT_SECRET', // Configuration key for JWT secret
  JWT_EXPIRES_IN_KEY: 'JWT_EXPIRES_IN', // Configuration key for JWT expiration
  REFRESH_TOKEN_SECRET_KEY: 'REFRESH_TOKEN_SECRET',
  REFRESH_TOKEN_EXPIRES_IN_KEY: 'REFRESH_TOKEN_EXPIRES_IN',
  ROLES_KEY_METADATA: 'roles',
  IS_PUBLIC_KEY_METADATA: 'isPublic',
  DEFAULT_USER_ROLE: 'Merchant', // Example default role
  ADMIN_ROLE: 'Administrator', // Example admin role
};

// It's often better to get JWT secrets and expirations from UserAuthConfigService
// This file can hold more static constants, like metadata keys or default role names if hardcoded.