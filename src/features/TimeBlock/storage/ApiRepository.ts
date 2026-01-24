import type {TimeBlockRepository} from './TimeBlockRepository.ts'
import type {TimeBlock, Period} from "../model/types.ts";

const HOST = import.meta.env.VITE_HOST || ''
const PORT = import.meta.env.VITE_PORT || ''
const API_PART = import.meta.env.VITE_API_PART || ''

const API_URL: string = `http://${HOST}:${PORT}/${API_PART}`

export class ApiRepository implements TimeBlockRepository {
    async getByPeriod(period: Period): Promise<TimeBlock[]> {
        const { startDate, view } = period
        console.log(API_URL)

        const start = new Date(startDate)
        const end = new Date(start)

        if (view === 'week') {
            end.setDate(end.getDate() + 7)
        }

        const res = await fetch(
            `${API_URL}/time-blocks?start=${start.toISOString()}&end=${end.toISOString()}`
        )

        return this.parseBlocks(await res.json())
    }

    async create(block: TimeBlock): Promise<TimeBlock> {
        console.log(block)
        const res = await fetch(`${API_URL}/time-blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(block)
        })

        return this.parseBlock(await res.json())
    }

    async update(id: string, block: TimeBlock): Promise<TimeBlock> {
        const res = await fetch(`${API_URL}/time-blocks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(block)
        })

        return this.parseBlock(await res.json())
    }

    async delete(blockId: string): Promise<void> {
        await fetch(`${API_URL}/time-blocks/${blockId}`, {
            method: 'DELETE'
        })
    }

    private parseBlocks(raw: any[]): TimeBlock[] {
        return raw.map(this.parseBlock)
    }

    private parseBlock(raw: any): TimeBlock {
        return {
            ...raw,
            startAt: new Date(raw.startAt),
            endAt: new Date(raw.endAt)
        }
    }
}