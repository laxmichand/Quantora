import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

jest.mock('ioredis', () => jest.fn());

const USER = { id: 'user-1', email: 'a@b.com', name: 'A', role: 'user' };

class Mutex {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(fn: () => Promise<T>): Promise<T> {
    const p = this.tail.then(fn);
    this.tail = p.catch(() => undefined);
    return p;
  }
}

const clone = (s: any) => ({ ...s });

describe('TokenService', () => {
  let service: TokenService;
  let redis: { [k: string]: jest.Mock };
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let store: Map<string, any>;
  let seq: number;
  let txUpdate: jest.Mock;
  let txCreate: jest.Mock;
  let txFindMany: jest.Mock;
  let txQueryRaw: jest.Mock;
  let prismaSession: {
    findUnique: jest.Mock;
    update: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    updateMany: jest.Mock;
  };
  const mutex = new Mutex();

  const makeSession = (overrides: any = {}) => ({
    id: overrides.id || `s-${++seq}`,
    userId: USER.id,
    deviceId: 'dev-1',
    sessionToken: `tok-${seq}`,
    accessTokenId: `acc-${seq}`,
    refreshTokenId: `fam-${seq}`,
    refreshTokenHash: `hash-${seq}`,
    previousRefreshTokenHash: null,
    revoked: false,
    logoutReason: null,
    logoutTime: null,
    expiresAt: new Date(Date.now() + 10 * 86400000),
    absoluteTimeout: new Date(Date.now() + 30 * 86400000),
    lastActivity: new Date(Date.now() - seq * 60000),
    createdAt: new Date(Date.now() - seq * 60000),
    ipAddress: '1.2.3.4',
    userAgent: 'test',
    ...overrides,
  });

  beforeEach(async () => {
    store = new Map();
    seq = 0;
    txUpdate = jest.fn();
    txCreate = jest.fn();
    txFindMany = jest.fn();
    txQueryRaw = jest.fn().mockResolvedValue([{ id: USER.id }]);
    prismaSession = {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    };
    redis = {
      blacklistToken: jest.fn().mockResolvedValue(undefined),
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
      markTokenFamily: jest.fn().mockResolvedValue(undefined),
      getTokenFamily: jest.fn().mockResolvedValue(null),
      addUserSession: jest.fn().mockResolvedValue(undefined),
      removeUserSession: jest.fn().mockResolvedValue(undefined),
      getUserSessions: jest.fn().mockResolvedValue([]),
      clearUserSessions: jest.fn().mockResolvedValue(undefined),
    };
    jwt = {
      signAsync: jest.fn(async (p: any) => `jwt-${p.type}-${p.jti}`),
      verifyAsync: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: jwt },
        {
          provide: PrismaService,
          useValue: {
            session: prismaSession,
            $transaction: jest.fn((fn: (tx: any) => Promise<any>) => mutex.run(() => fn(tx))),
          },
        },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = moduleRef.get(TokenService);

    const tx = {
      $queryRaw: txQueryRaw,
      session: {
        findMany: txFindMany,
        update: txUpdate,
        create: txCreate,
      },
    };
    txFindMany.mockImplementation((args: any) => {
      const w = args.where || {};
      return [...store.values()]
        .filter((s) => s.userId === (w.userId ?? s.userId))
        .filter((s) => (w.revoked === undefined ? true : s.revoked === w.revoked))
        .filter((s) => (w.expiresAt?.gt ? s.expiresAt > w.expiresAt.gt : true))
        .filter((s) => {
          if (!w.OR) return true;
          return w.OR.some((o: any) =>
            o.absoluteTimeout === null
              ? s.absoluteTimeout === null
              : o.absoluteTimeout?.gt
                ? s.absoluteTimeout > o.absoluteTimeout.gt
                : true,
          );
        })
        .sort((a, b) => {
          if (!args.orderBy) return 0;
          for (const key of Object.keys(args.orderBy)) {
            const dir = args.orderBy[key];
            const cmp = a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0;
            if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
          }
          return 0;
        })
        .map(clone);
    });
    txUpdate.mockImplementation((args: any) => {
      const s = store.get(args.where.id);
      if (!s) throw new Error('not found');
      store.set(args.where.id, { ...s, ...args.data });
      return Promise.resolve(clone(store.get(args.where.id)));
    });
    txCreate.mockImplementation((args: any) => {
      const id = `s-${++seq}`;
      const s = makeSession({ id, ...args.data });
      store.set(id, s);
      return Promise.resolve(clone(s));
    });
    prismaSession.findUnique.mockImplementation((args: any) =>
      Promise.resolve(store.get(args.where.id) ? clone(store.get(args.where.id)) : null),
    );
    prismaSession.update.mockImplementation((args: any) => {
      const s = store.get(args.where.id);
      if (!s) throw new Error('not found');
      store.set(args.where.id, { ...s, ...args.data });
      return Promise.resolve(clone(store.get(args.where.id)));
    });
    prismaSession.findFirst.mockImplementation((args: any) => {
      const w = args.where || {};
      const found = [...store.values()].find((s) =>
        Object.entries(w).every(([k, v]: [string, any]) => {
          if (k === 'OR') return true;
          if (v === null) return s[k] === null;
          if (v && typeof v === 'object' && 'not' in v) return s[k] !== v.not;
          if (v && typeof v === 'object' && 'gt' in v) return s[k] > v.gt;
          return s[k] === v;
        }),
      );
      return Promise.resolve(found ? clone(found) : null);
    });
    prismaSession.findMany.mockImplementation((args: any) => {
      const w = args.where || {};
      const rows = [...store.values()].filter((s) =>
        Object.entries(w).every(([k, v]: [string, any]) => {
          if (v && typeof v === 'object' && 'not' in v) return s[k] !== v.not;
          if (v && typeof v === 'object' && 'gt' in v) return s[k] > v.gt;
          return s[k] === v;
        }),
      );
      const selected = rows.map((s) =>
        args.select ? Object.fromEntries(Object.keys(args.select).map((k) => [k, s[k]])) : clone(s),
      );
      return Promise.resolve(selected);
    });
    prismaSession.updateMany.mockImplementation((args: any) => {
      const w = args.where || {};
      let count = 0;
      for (const s of [...store.values()]) {
        const match = Object.entries(w).every(([k, v]: [string, any]) =>
          v && typeof v === 'object' && 'not' in v ? s[k] !== v.not : s[k] === v,
        );
        if (match) {
          store.set(s.id, { ...s, ...args.data });
          count++;
        }
      }
      return Promise.resolve({ count });
    });
  });

  describe('session limit enforcement', () => {
    it('creates a session when the user has no active sessions (no eviction)', async () => {
      const result = await service.generateTokenPair(USER, 'dev-1', undefined, '9.9.9.9', 'ua');

      expect(txQueryRaw).toHaveBeenCalled();
      expect(txCreate).toHaveBeenCalledTimes(1);
      expect(txUpdate).not.toHaveBeenCalled();
      expect(result.evictedSessionId).toBeUndefined();
      expect(redis.addUserSession).toHaveBeenCalledWith(
        USER.id,
        result.sessionId,
        expect.any(Number),
      );
    });

    it('creates a session when the user has exactly 1 active session (no eviction)', async () => {
      store.set('s-1', makeSession({ id: 's-1', lastActivity: new Date(Date.now() - 10000) }));

      const result = await service.generateTokenPair(USER, 'dev-2');

      expect(txUpdate).not.toHaveBeenCalled();
      expect(result.evictedSessionId).toBeUndefined();
    });

    it('evicts the OLDEST active session when the user already has 2 active sessions', async () => {
      store.set(
        's-old',
        makeSession({
          id: 's-old',
          accessTokenId: 'acc-old',
          lastActivity: new Date(Date.now() - 7200000),
        }),
      );
      store.set(
        's-new',
        makeSession({
          id: 's-new',
          accessTokenId: 'acc-new',
          lastActivity: new Date(Date.now() - 60000),
        }),
      );

      const result = await service.generateTokenPair(USER, 'dev-3');

      const evictCall = txUpdate.mock.calls.find(
        (c: any) => c[0].where.id === 's-old' && c[0].data.revoked === true,
      );
      expect(evictCall).toBeDefined();
      expect(evictCall[0].data.logoutReason).toBe('session_limit_exceeded');
      expect(evictCall[0].data.logoutTime).toBeInstanceOf(Date);
      expect(result.evictedSessionId).toBe('s-old');
      expect(store.get('s-old').revoked).toBe(true);
      expect(store.get('s-new').revoked).toBe(false);
      expect(redis.removeUserSession).toHaveBeenCalledWith(USER.id, 's-old');
      expect(redis.blacklistToken).toHaveBeenCalledWith('acc-old', expect.any(Number));
    });

    it('always keeps the active session count <= 2 even when the session is NOT the oldest device', async () => {
      store.set(
        's-old',
        makeSession({
          id: 's-old',
          deviceId: 'dev-old',
          lastActivity: new Date(Date.now() - 7200000),
        }),
      );
      store.set(
        's-recent',
        makeSession({
          id: 's-recent',
          deviceId: 'dev-recent',
          lastActivity: new Date(Date.now() - 300000),
        }),
      );

      const result = await service.generateTokenPair(USER, 'dev-old');

      expect(result.evictedSessionId).toBe('s-old');
      const active = [...store.values()].filter(
        (s) => s.revoked === false && s.expiresAt > new Date(),
      );
      expect(active.length).toBe(2);
    });

    it('enforces the 2-session invariant under concurrent logins', async () => {
      const results = await Promise.all(
        Array.from({ length: 8 }, (_, i) => service.generateTokenPair(USER, `dev-${i}`)),
      );

      const active = [...store.values()].filter(
        (s) => s.revoked === false && s.expiresAt > new Date(),
      );
      const evicted = [...store.values()].filter(
        (s) => s.logoutReason === 'session_limit_exceeded',
      );
      expect(active.length).toBe(2);
      expect(evicted.length).toBe(6);
      expect(results.filter((r) => r.evictedSessionId).length).toBe(6);
    });

    it('does NOT enforce the limit when rotating an existing session', async () => {
      store.set('s-1', makeSession({ id: 's-1', deviceId: 'dev-x' }));

      const result = await service.generateTokenPair(USER, 'dev-x', 's-1');

      expect(txQueryRaw).not.toHaveBeenCalled();
      expect(txFindMany).not.toHaveBeenCalled();
      expect(txCreate).not.toHaveBeenCalled();
      expect(result.sessionId).toBe('s-1');
      expect(store.get('s-1').revoked).toBe(false);
    });

    it('persists a refresh token hash and records lastActivity on the session', async () => {
      const result = await service.generateTokenPair(USER, 'dev-1', undefined, '1.1.1.1', 'agent');

      const saved = store.get(result.sessionId);
      expect(saved.refreshTokenHash).toBeTruthy();
      expect(saved.refreshTokenHash).toHaveLength(64);
      expect(saved.ipAddress).toBe('1.1.1.1');
      expect(saved.userAgent).toBe('agent');
    });
  });

  describe('refresh token rotation', () => {
    it('rotates a valid refresh token within the same session', async () => {
      const oldToken = 'old-refresh';
      store.set(
        's-1',
        makeSession({
          id: 's-1',
          deviceId: 'dev-1',
          refreshTokenHash: service.hashToken(oldToken),
        }),
      );
      jwt.verifyAsync.mockResolvedValue({
        sub: USER.id,
        jti: 'old-jti',
        sid: 's-1',
        did: 'dev-1',
        family: 'fam-1',
        type: 'refresh',
      });
      prismaSession.findFirst.mockImplementation((args: any) => {
        const w = args.where || {};
        const found = [...store.values()].find((s) =>
          Object.entries(w).every(([k, v]: [string, any]) =>
            v === null ? s[k] === null : typeof v === 'object' ? s[k] > (v.gt ?? -1) : s[k] === v,
          ),
        );
        return Promise.resolve(found ? clone(found) : null);
      });

      const { tokenPair, reuseDetected } = await service.rotateRefreshToken(
        oldToken,
        USER,
        'dev-1',
      );

      expect(reuseDetected).toBe(false);
      expect(tokenPair.sessionId).toBe('s-1');
      expect(store.get('s-1').previousRefreshTokenHash).toBe(service.hashToken(oldToken));
      expect(store.get('s-1').refreshTokenHash).toBe(service.hashToken(tokenPair.refreshToken));
      expect(redis.blacklistToken).toHaveBeenCalledWith('old-jti', expect.any(Number));
    });

    it('revokes ONLY the reused session when a rotated (stale) refresh token is presented again', async () => {
      const staleToken = 'stale-refresh';
      store.set(
        's-1',
        makeSession({
          id: 's-1',
          deviceId: 'dev-1',
          refreshTokenHash: service.hashToken(staleToken),
        }),
      );
      store.set('s-2', makeSession({ id: 's-2', deviceId: 'dev-2' }));
      jwt.verifyAsync.mockResolvedValue({
        sub: USER.id,
        jti: 'old-jti',
        sid: 's-1',
        did: 'dev-1',
        family: 'fam-1',
        type: 'refresh',
      });
      prismaSession.findFirst.mockImplementation((args: any) => {
        const w = args.where || {};
        const found = [...store.values()].find((s) =>
          Object.entries(w).every(([k, v]: [string, any]) =>
            v === null ? s[k] === null : typeof v === 'object' ? s[k] > (v.gt ?? -1) : s[k] === v,
          ),
        );
        return Promise.resolve(found ? clone(found) : null);
      });

      await service.rotateRefreshToken(staleToken, USER, 'dev-1');
      jwt.verifyAsync.mockResolvedValueOnce({
        sub: USER.id,
        jti: 'old-jti',
        sid: 's-1',
        did: 'dev-1',
        family: 'fam-1',
        type: 'refresh',
      });

      await expect(service.rotateRefreshToken(staleToken, USER, 'dev-1')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(store.get('s-1').revoked).toBe(true);
      expect(store.get('s-1').logoutReason).toBe('token_reuse');
      expect(store.get('s-2').revoked).toBe(false);
    });

    it('throws for a token whose signature no longer verifies but revokes only the matching session', async () => {
      store.set(
        's-1',
        makeSession({
          id: 's-1',
          deviceId: 'dev-1',
          refreshTokenHash: service.hashToken('bad-token'),
        }),
      );
      store.set('s-2', makeSession({ id: 's-2', deviceId: 'dev-2' }));
      jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      prismaSession.findFirst.mockImplementation((args: any) => {
        const w = args.where || {};
        if (w.previousRefreshTokenHash) return Promise.resolve(null);
        const found = [...store.values()].find((s) =>
          Object.entries(w).every(([k, v]: [string, any]) =>
            v === null ? s[k] === null : typeof v === 'object' ? s[k] > (v.gt ?? -1) : s[k] === v,
          ),
        );
        return Promise.resolve(found ? clone(found) : null);
      });

      await expect(service.rotateRefreshToken('bad-token', USER, 'dev-1')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(store.get('s-1').revoked).toBe(true);
      expect(store.get('s-1').logoutReason).toBe('token_reuse');
      expect(store.get('s-2').revoked).toBe(false);
    });
  });

  describe('revocation helpers', () => {
    it('revokes a session, removes it from Redis and blacklists its access token', async () => {
      store.set('s-1', makeSession({ id: 's-1', accessTokenId: 'acc-1' }));

      await service.revokeSession('s-1', 'user_logout', 'user-1', '9.9.9.9');

      expect(store.get('s-1').revoked).toBe(true);
      expect(store.get('s-1').logoutReason).toBe('user_logout');
      expect(redis.removeUserSession).toHaveBeenCalledWith(USER.id, 's-1');
      expect(redis.blacklistToken).toHaveBeenCalledWith('acc-1', expect.any(Number));
    });

    it('is a no-op when the session is already revoked', async () => {
      store.set('s-1', makeSession({ id: 's-1', revoked: true }));

      await service.revokeSession('s-1', 'user_logout', 'user-1', '9.9.9.9');

      expect(redis.blacklistToken).not.toHaveBeenCalled();
      expect(redis.removeUserSession).not.toHaveBeenCalled();
    });

    it('revokes all sessions except the current one and blacklists each access token', async () => {
      store.set('s-1', makeSession({ id: 's-1', accessTokenId: 'acc-1', revoked: false }));
      store.set('s-2', makeSession({ id: 's-2', accessTokenId: 'acc-2', revoked: false }));
      store.set(
        's-current',
        makeSession({ id: 's-current', accessTokenId: 'acc-c', revoked: false }),
      );

      const count = await service.revokeAllUserSessions(USER.id, 's-current', 'user_logout_others');

      expect(count).toBe(2);
      expect(store.get('s-1').revoked).toBe(true);
      expect(store.get('s-2').revoked).toBe(true);
      expect(store.get('s-current').revoked).toBe(false);
      expect(redis.blacklistToken).toHaveBeenCalledWith('acc-1', expect.any(Number));
      expect(redis.blacklistToken).toHaveBeenCalledWith('acc-2', expect.any(Number));
      expect(redis.clearUserSessions).toHaveBeenCalledWith(USER.id, 's-current');
    });
  });
});
