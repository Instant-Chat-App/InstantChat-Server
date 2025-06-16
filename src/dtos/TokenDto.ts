export interface TokenPayload {
  accountId: number;
  phone: string;
  tokenType?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}