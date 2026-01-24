import {useEffect, useRef, useState} from 'react'
import type {Period, TimeBlock, TimeBlockInteractions} from '../model/types.ts'
import type {TimeBlockRepository} from "../storage/TimeBlockRepository.ts";

type Props = {
    repository: TimeBlockRepository
    period: Period
}

export function useTimeBlocksController({repository, period}: Props) {
    const [blocks, setBlocks] = useState<TimeBlock[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        async function load() {
            setIsLoading(true)
            const data = await repository.getByPeriod(period)
            if (!cancelled) {
                setBlocks(data)
                setIsLoading(false)
            }
        }

        load()

        return () => {
            cancelled = true
        }
    }, [repository, period])

    const [menuState, setMenuState] = useState<{
        visible: boolean
        x: number
        y: number
        block: TimeBlock | null
    }>({ visible: false, x: 0, y: 0, block: null })

    const ignoreNextClickRef = useRef(false)

    async function commitCreate(id: string, title: string) {
        let savedBlock: TimeBlock | null = null

        setBlocks(prev =>
            prev.map(b => {
                if (b.id === id) {
                    savedBlock = { ...b, title, isNew: false }
                    return savedBlock
                }
                return b
            })
        )

        if (!savedBlock) return

        try {
            await repository.create(savedBlock)
        } catch (e) {
            console.error(e)
        }
    }

    async function updateTime(id: string, startAt: Date, endAt: Date) {
        setBlocks(prev =>
            prev.map(b => b.id === id ? { ...b, startAt, endAt } : b)
        )

        try {
            await repository.update(id, {startAt, endAt })
        } catch (e) {
            console.error(e)
        }
    }

    async function updateTitle(id: string, title: string) {
        setBlocks(prev =>
            prev.map(b => b.id === id ? { ...b, title, isNew: false } : b)
        )

        try {
            await repository.update(id, { title })
        } catch (e) {
            console.error(e)
        }
    }

    async function deleteBlock(id: string) {
        const prevBlocks = blocks

        setBlocks(prev => prev.filter(b => b.id !== id))

        try {
            await repository.delete(id)
        } catch (e) {
            setBlocks(prevBlocks)
        }
    }

    async function changeColor(id: string, color: string) {
        setBlocks(prev =>
            prev.map(b => b.id === id ? { ...b, color } : b)
        )

        try {
            await repository.update(id, { color })
        } catch (e) {
            console.error(e)
        }
    }

    function openMenu(x: number, y: number, block: TimeBlock) {
        setMenuState({ visible: true, x, y, block })
    }

    function closeMenu() {
        ignoreNextClickRef.current = true

        setMenuState({ visible: false, x: 0, y: 0, block: null })

        setTimeout(() => {
            ignoreNextClickRef.current = false
        }, 0)
    }

    function createDraft(block: TimeBlock) {
        setBlocks(prev => [...prev, block])
    }

    const interactions: TimeBlockInteractions = {
        move: { start: () => {} },
        resize: { start: () => {} },
        menu: {
            open: openMenu,
            close: closeMenu,
            isOpen: () => menuState.visible
        },
        crud: {
            createDraft,
            commitCreate,
            updateBlockTime: updateTime,
            updateTitle,
            deleteBlock,
            changeColor,
            cancelCreate: deleteBlock
        }
    }

    return {
        blocks,
        isLoading,
        menuState,
        interactions,
        ignoreNextClickRef
    }
}