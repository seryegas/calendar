import type {TimeBlockRepository} from './TimeBlockRepository'
import {LocalRepository} from './LocalRepository'
import {storageConfig} from '../../../app/config/storage.ts'

export function createTimeBlockRepository(): TimeBlockRepository {
    switch (storageConfig.type) {
        case 'local':
            return new LocalRepository(storageConfig.baseDir)
        default:
            throw new Error('Unknown storage type')
    }
}