import {useRef, useState} from 'react'
import type {TimeBlock, TimeBlockInteractions} from '../model/types'

type Props = {
    initialBlocks: TimeBlock[]
}

export function useTimeBlocksController({initialBlocks}: Props) {
    const [blocks, setBlocks] = useState<TimeBlock[]>(initialBlocks)
    const [menuState, setMenuState] = useState<{
        visible: boolean
        x: number
        y: number
        block: TimeBlock | null
    }>({ visible: false, x: 0, y: 0, block: null })

    const ignoreNextClickRef = useRef(false)

    function create(block: TimeBlock) {
        setBlocks(prev => [...prev, block])
    }

    function updateTime(id: string, startAt: Date, endAt: Date) {
        setBlocks(prev =>
            prev.map(b => b.id === id ? { ...b, startAt, endAt } : b)
        )
    }

    function updateTitle(id: string, title: string) {
        setBlocks(prev =>
            prev.map(b => b.id === id ? { ...b, title, isNew: false } : b)
        )
    }

    function deleteBlock(id: string) {
        setBlocks(prev => prev.filter(b => b.id !== id))
    }

    function changeColor(id: string, color: string) {
        setBlocks(prev =>
            prev.map(b => b.id === id ? { ...b, color } : b)
        )
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

    const interactions: TimeBlockInteractions = {
        move: { start: () => {} },
        resize: { start: () => {} },
        menu: {
            open: openMenu,
            close: closeMenu,
            isOpen: () => menuState.visible
        },
        crud: {
            create,
            updateBlockTime: updateTime,
            updateTitle,
            deleteBlock,
            changeColor,
            cancelCreate: deleteBlock
        }
    }

    return {
        blocks,
        menuState,
        interactions,
        ignoreNextClickRef
    }
}