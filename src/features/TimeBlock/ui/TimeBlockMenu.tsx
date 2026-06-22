import { useState, useEffect, useRef } from 'react';
import type {TimeBlock, TimeBlockInteractions} from '../model/types.ts';
import './TimeBlockMenu.css'

const BASE_COLORS = ['#d2e3fc', '#4285f4', '#34a853', '#fbbc05', '#ea4335', '#742087'];
const EXTRA_COLORS = ['#e8eaed', '#f28b82', '#aecbfa', '#ccff90', '#fdd663', '#a142f4'];

type Props = {
    block: TimeBlock | null
    x: number
    y: number
    interactions: TimeBlockInteractions
}

export function TimeBlockMenu({ block, x, y, interactions }: Props) {
    const [title, setTitle] = useState(block?.title ?? '');
    const [color, setColor] = useState(block?.color ?? BASE_COLORS[0]);
    const [pos, setPos] = useState({ top: y, left: x });
    const ref = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const onClose = interactions.menu.close;

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                onClose();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        if (block) {
            setTitle(block.title);
            setColor(block.color ?? BASE_COLORS[0]);
        }
    }, [block]);

    useEffect(() => {
        if (!ref.current || !block) return;

        const rect = ref.current.getBoundingClientRect();
        let top = y;
        let left = x;

        if (y + rect.height > window.innerHeight) {
            top = y - rect.height;
        }
        if (x + rect.width > window.innerWidth) {
            left = x - rect.width;
        }

        top = Math.max(0, top);
        left = Math.max(0, left);

        setPos({ top, left });
    }, [block, x, y]);

    if (!block) return null;

    function commitTitle() {
        if (title.trim() !== '' && block) {
            interactions.crud.updateTitle(block.id, title.trim());
        }
    }

    function handleCopy() {
        if (!block) return;
        const startAt = new Date(block.startAt);
        const endAt = new Date(block.endAt);
        interactions.crud.createDraft({
            id: crypto.randomUUID(),
            title: block.title,
            startAt,
            endAt,
            color: block.color,
        });
        onClose();
    }

    function handleEdit() {
        titleRef.current?.focus();
        titleRef.current?.select();
    }

    function handleDelete() {
        if (!block) return;
        interactions.crud.deleteBlock(block.id);
        onClose();
    }

    function handleColorClick(c: string) {
        if (!block) return;
        setColor(c);
        interactions.crud.changeColor(block.id, c);
    }

    return (
        <div
            ref={ref}
            className="time-block-menu"
            style={{
                top: pos.top,
                left: pos.left,
            }}
            onPointerDown={e => e.stopPropagation()}
        >
            <div className="tb-menu-toolbar">
                <button className="tb-menu-icon-btn" onClick={handleEdit} title="Редактировать">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        <path d="m15 5 4 4"/>
                    </svg>
                </button>
                <button className="tb-menu-icon-btn" onClick={handleCopy} title="Копировать">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                </button>
                <button className="tb-menu-icon-btn tb-menu-icon-btn--danger" onClick={handleDelete} title="Удалить">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
                <button className="tb-menu-icon-btn tb-menu-icon-btn--close" onClick={onClose} title="Закрыть">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <div className="tb-menu-title">
                <input
                    ref={titleRef}
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitTitle(); }}
                    onBlur={commitTitle}
                    placeholder="Название"
                />
            </div>

            <div className="tb-menu-colors">
                {BASE_COLORS.map(c => (
                    <div
                        key={c}
                        className={`tb-color-swatch ${color === c ? 'selected' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => handleColorClick(c)}
                    />
                ))}
            </div>
            <div className="tb-menu-colors">
                {EXTRA_COLORS.map(c => (
                    <div
                        key={c}
                        className={`tb-color-swatch ${color === c ? 'selected' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => handleColorClick(c)}
                    />
                ))}
            </div>
        </div>
    )
}
