import { Injectable } from '@nestjs/common'
import { AuditResult, Prisma } from '@prisma/client'
import { paginated, parsePagination } from '../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: Record<string, any> = {}) {
    const where: Prisma.AuditLogWhereInput = {}
    if (query.actorId) where.actorId = query.actorId
    if (query.targetId) where.targetId = query.targetId
    if (query.result) where.result = query.result as AuditResult
    if (query.action) where.action = { contains: String(query.action) }
    if (query.from || query.to) {
      where.timestamp = {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      }
    }

    const { page, limit, skip, take } = parsePagination(query)
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: query.page || query.limit ? skip : undefined,
        take: query.page || query.limit ? take : undefined,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return query.page || query.limit ? paginated(items, total, page, limit) : items
  }
}
