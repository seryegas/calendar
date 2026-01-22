import { useState, useEffect, useRef } from 'react';
import type {TimeBlock, TimeBlockInteractions} from '../model/types';
import './TimeBlockMenu.css'

const PRESET_COLORS = ['#d2e3fc', '#4285f4', '#34a853', '#fbbc05', '#ea4335', '#742087'];

type Props = {
    block: TimeBlock | null
    x: number
    y: number
    interactions: TimeBlockInteractions
}

export function TimeBlockMenu({ block, x, y, interactions }: Props) {
    const [title, setTitle] = useState(block?.title ?? '');
    const [color, setColor] = useState(block?.color ?? PRESET_COLORS[0]);
    const ref = useRef<HTMLDivElement>(null);
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
            setColor(block.color ?? PRESET_COLORS[0]);
        }
    }, [block]);

    if (!block) return null;

    function commitTitle() {
        if (title.trim() !== '' && block) {
            interactions.crud.updateTitle(block.id, title.trim());
        }
    }

    return (
        <div
            ref={ref}
            className="time-block-menu"
            style={{
                top: y,
                left: x,
            }}
            onPointerDown={e => e.stopPropagation()}
        >
            <div className="tb-menu-title">
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Название"
                />
                <button className="tb-menu-confirm" onClick={commitTitle}>
                    ✔
                </button>
            </div>
            <div className="tb-menu-colors">
                {PRESET_COLORS.map(c => (
                    <div
                        key={c}
                        className={`tb-color-swatch ${color === c ? 'selected' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => {
                            setColor(c);
                            interactions.crud.changeColor(block.id, c);
                        }}
                    />
                ))}
            </div>
            <button onClick={() => { interactions.crud.deleteBlock(block.id); onClose(); }}>Удалить</button>
        </div>
    )
}