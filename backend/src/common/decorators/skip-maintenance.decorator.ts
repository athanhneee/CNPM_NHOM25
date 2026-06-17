import { SetMetadata } from '@nestjs/common'

export const IS_SKIP_MAINTENANCE_KEY = 'isSkipMaintenance'
export const SkipMaintenance = () => SetMetadata(IS_SKIP_MAINTENANCE_KEY, true)
