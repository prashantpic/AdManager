export interface JwtPayload {
  sub: string; // Standard JWT 'subject' claim, used for userId
  email: string;
  roles: string[];
  isMfaAuthenticated: boolean;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}