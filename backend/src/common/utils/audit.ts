import { AuditResult, Prisma, UserRole } from '@prisma/client'

type PrismaAuditClient = Pick<Prisma.TransactionClient, 'auditLog'>

export interface AuditActor {
  actorId: string
  actorRole: UserRole
}

export function buildActor(user: { userId: string; roles?: UserRole[] }): AuditActor {
  return {
    actorId: user.userId,
    actorRole: user.roles?.[0] ?? UserRole.STUDENT,
  }
}

export async function appendAuditLog(
  prisma: PrismaAuditClient,
  actor: AuditActor,
  action: string,
  targetId: string,
  result: AuditResult,
  message: string,
  metadata?: Prisma.InputJsonValue,
) {
  return prisma.auditLog.create({
    data: {
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action,
      targetId,
      result,
      message,
      metadata,
    },
  })
}
