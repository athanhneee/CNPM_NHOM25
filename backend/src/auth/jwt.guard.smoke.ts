import { strict as assert } from 'assert'
import { UnauthorizedException } from '@nestjs/common'
import * as jwt from 'jsonwebtoken'
import { JwtAuthGuard } from '../common/guards/jwt.guard'

const JWT_SECRET = 'jwt-guard-smoke-secret'

type SmokeUser = {
  id: string
  username: string
  email: string
  roles: string[]
  status: 'ACTIVE' | 'LOCKED' | 'INACTIVE'
}

function makePrisma(users: Record<string, SmokeUser>) {
  return {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => users[where.id] ?? null,
    },
  }
}

function makeContext(token: string) {
  const request: any = {
    headers: {
      authorization: `Bearer ${token}`,
    },
    user: null,
  }

  return {
    request,
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    },
  }
}

async function assertUnauthorized(callback: () => Promise<unknown>) {
  await assert.rejects(callback, UnauthorizedException)
}

async function main() {
  const previousSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = JWT_SECRET

  try {
    const activeToken = jwt.sign(
      { sub: 'user-active', userId: 'user-active', roles: ['STUDENT'] },
      JWT_SECRET,
      { expiresIn: '5m' },
    )
    const lockedToken = jwt.sign(
      { sub: 'user-locked', userId: 'user-locked', roles: ['STUDENT'] },
      JWT_SECRET,
      { expiresIn: '5m' },
    )

    const guard = new JwtAuthGuard(
      makePrisma({
        'user-active': {
          id: 'user-active',
          username: 'N23DCCN001',
          email: 'n23dccn001@student.ptithcm.edu.vn',
          roles: ['STUDENT'],
          status: 'ACTIVE',
        },
        'user-locked': {
          id: 'user-locked',
          username: 'N23DCCN020',
          email: 'n23dccn020@student.ptithcm.edu.vn',
          roles: ['STUDENT'],
          status: 'LOCKED',
        },
      }) as any,
    )

    const active = makeContext(activeToken)
    assert.equal(await guard.canActivate(active.context as any), true)
    assert.equal(active.request.user.userId, 'user-active')
    assert.deepEqual(active.request.user.roles, ['STUDENT'])

    const locked = makeContext(lockedToken)
    await assertUnauthorized(() => guard.canActivate(locked.context as any))
  } finally {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET
    } else {
      process.env.JWT_SECRET = previousSecret
    }
  }

  console.log('JWT guard smoke tests passed.')
}

void main()
