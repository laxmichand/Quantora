export interface UserPayload {
  sub: string;
  email: string;
  role: string;
  did?: string;
  sid?: string;
  iat?: number;
  exp?: number;
}
