type ViewType = 'month' | 'week' | 'day';

interface HeaderProps {
    view: ViewType;
    onChangeView: (view: ViewType) => void;
    dateLabel: string;
}

export function Header({
                           view,
                           onChangeView,
                           dateLabel,
                       }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-left">
                <span className="logo">📅 Календарь</span>
            </div>

            <div className="header-center">
                <ViewSwitcher view={view} onChange={onChangeView} />
                <span className="current-date">{dateLabel}</span>
            </div>

            <div className="header-right">
                <button className="account-button">
                    👤 Аккаунт
                </button>
            </div>
        </header>
    );
}