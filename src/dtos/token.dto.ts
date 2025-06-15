export interface TokenPayload {
  accountId: number;
  phoneNumber: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}