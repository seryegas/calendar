import type {TimeBlockRepository} from './TimeBlockRepository.ts'
import type {TimeBlock, Period} from "../model/types.ts";

export class LocalRepository implements TimeBlockRepository {
    private readonly baseDir: string

    constructor(baseDir: string) {
        this.baseDir = baseDir
        console.log(this.baseDir)
    }

    getByPeriod(period: Period): TimeBlock[] {
        console.log(period)
        return []
    }

    async save(blocks: TimeBlock[]): Promise<void> {
        console.log('save', blocks)
    }

    async create(block: TimeBlock): Promise<void> {
        console.log('create', block)
    }

    async update(block: TimeBlock): Promise<void> {
        console.log('update', block)
    }

    async delete(blockId: string): Promise<void> {
        console.log(`Block with id ${blockId} deleted`)
    }
}