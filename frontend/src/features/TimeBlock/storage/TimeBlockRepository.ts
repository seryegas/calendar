import type {Period, TimeBlock} from '../model/types'

export interface TimeBlockRepository {
    getByPeriod(period: Period): Promise<TimeBlock[]>
    create(block: TimeBlock): Promise<TimeBlock>
    update(id: string, patch: Partial<TimeBlock>): Promise<TimeBlock>
    delete(id: string): Promise<void>
}