import './ui/WeekGrid.css'
import {useRef, useState} from "react";
import {DayHeader} from "./ui/DayHeader.tsx";
import {DayColumn} from "./ui/DayColumn.tsx";
import {startOfWeek} from "../../../../shared/lib/date/date.ts";
import {useCalendar} from "../../../../app/providers/CalendarProvider.tsx";
import type {TimeBlock, TimeBlockInteractions} from "../../../../features/TimeBlock/model/types.ts";
import {getBlocksForDay} from "../../../../features/TimeBlock/model/selectors.ts";
import {TimeBlockMenu} from "../../../../features/TimeBlock/ui/TimeBlockMenu.tsx";

export function WeekGrid() {
    const {selectedDay} = useCalendar()
    const weekStart = startOfWeek(selectedDay);
    const [menuState, setMenuState] = useState<{
        visible: boolean
        x: number
        y: number
        block: TimeBlock | null
    }>({ visible: false, x: 0, y: 0, block: null });
    const ignoreNextClickRef = useRef(false);

    const [blocks, setBlocks] = useState<TimeBlock[]>([
        {
            id: '1',
            title: 'Работа',
            startAt: new Date(2026, 0, 20, 9, 0),
            endAt: new Date(2026, 0, 20, 11, 0),
            color: '#4285f4',
        },
        {
            id: '2',
            title: 'Созвон',
            startAt: new Date(2026, 0, 20, 10, 0),
            endAt: new Date(2026, 0, 20, 15, 30),
            color: '#34a853',
        },
        {
            id: '3',
            title: 'Работfffffffа',
            startAt: new Date(2026, 0, 20, 9, 30),
            endAt: new Date(2026, 0, 20, 11, 0),
            color: '#742087',
        },
    ])

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + i)
        return d
    })

    function handleUpdateBlock(
        id: string,
        startAt: Date,
        endAt: Date
    ) {
        setBlocks(prev =>
            prev.map(b =>
                b.id === id
                    ? { ...b, startAt, endAt }
                    : b
            )
        )
    }

    function handleCreateBlock(block: TimeBlock) {
        setBlocks(prev => [...prev, block])
    }

    function handleUpdateTitle(id: string, title: string) {
        setBlocks(prev =>
            prev.map(b =>
                b.id === id
                    ? { ...b, title, isNew: false }
                    : b
            )
        )
    }

    function handleCancelCreate(id: string) {
        setBlocks(prev =>
            prev.filter(b => b.id !== id)
        )
    }

    function handleDeleteBlock(id: string) {
        setBlocks(prev => prev.filter(b => b.id !== id))
    }

    function handleChangeColor(id: string, color: string) {
        setBlocks(prev =>
            prev.map(b => b.id === id ? { ...b, color } : b)
        );
    }

    function handleMenuOpen(x: number, y: number, block: TimeBlock) {
        setMenuState({ visible: true, x, y, block })
    }

    function handleMenuClose() {
        ignoreNextClickRef.current = true;

        setMenuState(prev => ({
            ...prev,
            visible: false,
            block: null
        }));

        setTimeout(() => {
            ignoreNextClickRef.current = false;
        }, 0);
    }

    function handleMenuIsOpen() {
        return menuState.visible
    }

    const interactions: TimeBlockInteractions = {
        move: {
            start: () => {}
        },
        resize: {
            start: () => {}
        },
        menu: {
            open: handleMenuOpen,
            close: handleMenuClose,
            isOpen: handleMenuIsOpen
        },
        crud: {
            create: handleCreateBlock,
            updateBlockTime: handleUpdateBlock,
            updateTitle: handleUpdateTitle,
            cancelCreate: handleCancelCreate,
            deleteBlock: handleDeleteBlock,
            changeColor: handleChangeColor
        }
    }

    return (
        <div className="week">
            <div className="week-header">
                <div className="time-col" />
                {days.map(day => (
                    <DayHeader key={day.toISOString()} date={day} />
                ))}
            </div>

            <div className="week-scroll">
                <div className="week-body">
                    <div className="time-col">
                        {Array.from({ length: 24 }, (_, h) => (
                            h === 0 ? (
                                <div key={h} className="hour-label-empty" />
                            ) : (
                                <div key={h} className="hour-label">
                                    {String(h).padStart(2, '0')}:00
                                </div>
                            )
                        ))}
                    </div>

                    <div className="days-grid">
                        {days.map(day => (
                            <DayColumn
                                key={day.toISOString()}
                                date={day}
                                blocks={getBlocksForDay(blocks, day)}
                                interactions={interactions}
                            /> // отрефакторить в будущем (отфильтровать по дням блоки заранее
                        ))}
                    </div>
                </div>
            </div>
            {menuState.visible && menuState.block && (
                <TimeBlockMenu
                    block={menuState.block}
                    x={menuState.x}
                    y={menuState.y}
                    interactions={interactions}
                />
            )}
        </div>
    )
}