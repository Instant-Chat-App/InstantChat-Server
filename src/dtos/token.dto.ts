export interface TokenPayload {
  accountId: number;
  phone: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}