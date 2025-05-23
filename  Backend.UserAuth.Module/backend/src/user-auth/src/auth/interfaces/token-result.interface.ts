export interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number; // Typically in seconds
  tokenType: string; // e.g., 'Bearer'
}