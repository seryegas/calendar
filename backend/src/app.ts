import express from 'express'
import cors from 'cors'
import { timeBlockRouter } from './routes/TimeBlockRoutes'

export const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/time-blocks', timeBlockRouter)

app.get('/ping', (_, res) => {
    res.json({ ok: "444123" })
})