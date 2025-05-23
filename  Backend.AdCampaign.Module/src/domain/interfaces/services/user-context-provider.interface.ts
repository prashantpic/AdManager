export interface UserContext {
  merchantId: string;
  userId?: string; // If user-specific actions within merchant context are needed
  // roles?: string[]; // If RBAC is used
}

export interface IUserContextProvider {
  getMerchantId(): string; // Throws if not available
  getUserId(): string | undefined; // Optional user ID
  // Optional: getFullContext(): UserContext;
}

export const IUserContextProvider = Symbol('IUserContextProvider');