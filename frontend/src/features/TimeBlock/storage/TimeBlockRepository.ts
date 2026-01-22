import type {Period, TimeBlock} from '../model/types'

export interface TimeBlockRepository {
    getByPeriod(period: Period): TimeBlock[]
    save(blocks: TimeBlock[]): Promise<void>

    create(block: TimeBlock): Promise<void>
    update(block: TimeBlock): Promise<void>
    delete(id: string): Promise<void>
}