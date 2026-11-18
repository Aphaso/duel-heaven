import { useEffect, useRef, type ReactNode } from 'react';
import type { Card } from '../types';
import { Badge } from '../ui/Badge';
import { CloseIcon, StarIcon } from '../ui/icons';
import { cn } from '../ui/styles';
import CardTile from './CardTile';
import { attributeClass, frameBgClass, frameTextClass, isMonster, levelLabel } from './cardStyles';

interface Props {
    card: Card | null;
    onClose: () => void;
}

/** Detail of a card in a modal window: image, stats and effect text. */
export default function CardDetailDialog({ card, onClose }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // The native dialog is opened and closed with methods: this syncs it with the prop
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }
        if (card && !dialog.open) {
            dialog.showModal();
        }
        if (!card && dialog.open) {
            dialog.close();
        }
    }, [card]);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby='card-detail-title'
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            className='m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl animate-rise-in overflow-hidden rounded-panel border border-line bg-surface-overlay p-0 text-ink shadow-overlay backdrop:bg-night-950/75 backdrop:backdrop-blur-sm'
        >
            {card && (
                <div className='relative flex max-h-[calc(100dvh-2rem)] flex-col sm:flex-row'>
                    <button
                        type='button'
                        onClick={onClose}
                        aria-label='Close'
                        className='focus-ring absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-night-950/70 text-ink-muted backdrop-blur hover:text-ink'
                    >
                        <CloseIcon className='size-4' />
                    </button>

                    {/* Image on a background with the frame color */}
                    <div className='relative flex shrink-0 justify-center overflow-hidden bg-surface-sunken p-6 sm:w-80 sm:items-center'>
                        <div aria-hidden='true' className={cn('absolute inset-0 opacity-25 blur-3xl', frameBgClass(card))}></div>
                        <div className='relative w-40 sm:w-full'>
                            <CardTile card={card}></CardTile>
                        </div>
                    </div>

                    <div className='scrollbar-thin min-w-0 flex-1 space-y-5 overflow-y-auto p-6'>
                        <header className='space-y-2 pr-10'>
                            <p className={cn('label', frameTextClass(card))}>{card.type}</p>
                            <h2 id='card-detail-title' className='font-display text-title text-ink'>
                                {card.name}
                            </h2>
                            <div className='flex flex-wrap gap-1.5'>
                                {card.attribute && (
                                    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 font-display text-micro font-semibold tracking-label uppercase', attributeClass(card.attribute))}>
                                        {card.attribute}
                                    </span>
                                )}
                                {card.race && <Badge>{card.race}</Badge>}
                                {card.archetype && <Badge tone='secondary'>{card.archetype}</Badge>}
                            </div>
                        </header>

                        {isMonster(card) && (
                            <dl className='grid grid-cols-3 gap-2'>
                                {card.level !== null && (
                                    <Stat label={levelLabel(card)}>
                                        <span className='inline-flex items-center gap-1'>
                                            {levelLabel(card) === 'Level' && <StarIcon className='size-4 fill-relic-400 text-relic-400' />}
                                            {card.level}
                                        </span>
                                    </Stat>
                                )}
                                {card.atk !== null && <Stat label='ATK'>{card.atk}</Stat>}
                                {card.def !== null && <Stat label='DEF'>{card.def}</Stat>}
                            </dl>
                        )}

                        <section className='space-y-2'>
                            <h3 className='label text-ink-subtle'>Card Text</h3>
                            <p className='rounded-control border border-line bg-surface-sunken p-4 text-sm leading-relaxed whitespace-pre-line text-ink-muted'>
                                {card.desc}
                            </p>
                        </section>
                    </div>
                </div>
            )}
        </dialog>
    );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className='rounded-control border border-line bg-surface-raised px-3 py-2'>
            <dt className='label text-ink-subtle'>{label}</dt>
            <dd className='numeric text-heading text-ink'>{children}</dd>
        </div>
    );
}
