import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback_secret_for_jwt_auth_tv_cinora';

export function signJwt(payload: any, expiresIn: string = '30d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
