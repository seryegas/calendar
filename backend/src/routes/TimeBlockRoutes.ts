import { Router } from 'express'
import { TimeBlockController } from '../controllers/TimeBlockController'

export const timeBlockRouter = Router()

timeBlockRouter.get('/', TimeBlockController.getByPeriod)
timeBlockRouter.get('/:id', TimeBlockController.getById)
timeBlockRouter.post('/', TimeBlockController.create)
timeBlockRouter.put('/:id', TimeBlockController.update)
timeBlockRouter.delete('/:id', TimeBlockController.delete)