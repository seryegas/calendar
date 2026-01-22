import { Schema, model } from 'mongoose'

const TimeBlockSchema = new Schema(
    {
        id: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        description: { type: String },
        startAt: { type: Date, required: true, index: true },
        endAt: { type: Date, required: true, index: true },
        color: { type: String }
    },
    {
        timestamps: true
    }
)

export const TimeBlockModel = model('TimeBlock', TimeBlockSchema)