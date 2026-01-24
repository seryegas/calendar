import type {TimeBlockRepository} from './TimeBlockRepository.ts'
import {ApiRepository} from './ApiRepository.ts'
import {storageConfig} from '../../../app/config/storage.ts'

export function createTimeBlockRepository(): TimeBlockRepository {
    switch (storageConfig.type) {
        case 'api':
            return new ApiRepository()
        default:
            throw new Error('Unknown storage type')
    }
}