import { Request, Response } from 'express'
import { TimeBlockModel } from '../model/TimeBlock'

export class TimeBlockController {
    static async getByPeriod(req: Request, res: Response) {
        const { start, end } = req.query

        if (!start || !end) {
            return res.status(400).json({ error: 'start and end required' })
        }

        const blocks = await TimeBlockModel.find({
            startAt: { $lt: new Date(end as string) },
            endAt: { $gt: new Date(start as string) }
        })

        res.json(blocks)
    }

    static async create(req: Request, res: Response) {
        console.log(req.body)
        const block = await TimeBlockModel.create(req.body)
        res.status(201).json(block)
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params

        const updated = await TimeBlockModel.findOneAndUpdate(
            { id },
            req.body,
            { new: true }
        )

        res.json(updated)
    }

    static async delete(req: Request, res: Response) {
        const { id } = req.params
        await TimeBlockModel.deleteOne({ id })
        res.json({ ok: true })
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params
        const timeBlock = await TimeBlockModel.findById({ id })
        if (!timeBlock) {
            res.status(404).json({ error: 'timeBlock not found' })
        }
        res.json(timeBlock)
    }
}