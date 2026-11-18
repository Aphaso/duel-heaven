import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { downloadProxies } from '../api';
import { saveBlob } from '../download';
import CardTile from './CardTile';
import {
    proxyCopies,
    proxyFileName,
    proxyKey,
    proxyPages,
    proxyRows,
    proxyTotal,
    selectAllProxies,
    setProxyCopies,
    type ProxyDraft,
} from '../proxyDraft';
import type { DeckDetail, DeckSection } from '../types';
import { ZONE_STYLES } from './deckZones';
import { Button } from '../ui/Button';
import { DownloadIcon, PrinterIcon } from '../ui/icons';
import { Stepper } from '../ui/Stepper';
import { EmptyState, ErrorMessage, Notice } from '../ui/States';
import { cn, panelStyles } from '../ui/styles';

interface Props {
    deck: DeckDetail;
    decklistDirty: boolean;
}

const SECTIONS: { id: DeckSection; label: string }[] = [
    { id: 'MAIN', label: 'Main Deck' },
    { id: 'EXTRA', label: 'Extra Deck' },
    { id: 'SIDE', label: 'Side Deck' },
];

export default function ProxiesPanel({ deck, decklistDirty }: Props) {
    // The choice lives only in the browser: it is not saved
    const [draft, setDraft] = useState<ProxyDraft>({});
    const entries = deck.cards;
    const total = proxyTotal(draft, entries);
    const pages = proxyPages(total);

    const download = useMutation({
        mutationFn: async () => {
            const blob = await downloadProxies(deck.id, proxyRows(draft, entries));
            saveBlob(blob, proxyFileName(deck.name));
        },
    });

    return (
        <div className='space-y-5'>
            <div className={`${panelStyles} flex flex-wrap items-center gap-4 p-panel`}>
                <div className='mr-auto space-y-1'>
                    <p className='text-sm text-ink-muted'>
                        <span className='numeric text-heading text-ink'>{total}</span> card{total === 1 ? '' : 's'}
                        {total > 0 && <span className='numeric text-ink-subtle'> · {pages} A4 page{pages === 1 ? '' : 's'}</span>}
                    </p>
                    <p className='text-caption text-ink-faint'>
                        Every Card is printed at 59 × 86 mm, 9 per A4 page, with a small gap to cut them out.
                    </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                    <Button size='sm' variant='ghost' onClick={() => setDraft(selectAllProxies(entries))} disabled={entries.length === 0}>
                        Select All
                    </Button>
                    <Button size='sm' variant='ghost' onClick={() => setDraft({})} disabled={total === 0}>
                        Clear
                    </Button>
                    <Button size='sm' variant='primary' onClick={() => download.mutate()} disabled={total === 0} loading={download.isPending}>
                        {!download.isPending && <DownloadIcon className='size-4' />}
                        {download.isPending ? 'Creating PDF...' : 'Download PDF'}
                    </Button>
                </div>
            </div>

            {decklistDirty && <Notice>The Decklist has unsaved changes. The proxies use the saved Decklist.</Notice>}
            {download.isError && <ErrorMessage>{download.error.message}</ErrorMessage>}

            {entries.length === 0 && (
                <EmptyState icon={<PrinterIcon />} title='Nothing to print yet' description='The Decklist is empty: add Cards in the Decklist tab first.'></EmptyState>
            )}

            {SECTIONS.map(({ id, label }) => {
                const rows = entries.filter((e) => e.section === id);
                if (rows.length === 0) {
                    return null;
                }
                return (
                    <section key={id} className='space-y-3'>
                        <h3 className={cn('label flex items-center gap-2', ZONE_STYLES[id].text)}>
                            <span aria-hidden='true' className={cn('size-1.5 rounded-full', ZONE_STYLES[id].bar)}></span>
                            {label}
                        </h3>
                        <ul className='grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10'>
                            {rows.map((e) => {
                                const copies = proxyCopies(draft, e);
                                return (
                                    <li key={proxyKey(e)} className='flex flex-col items-center gap-1.5 text-center'>
                                        <div className={cn('relative w-full rounded-card ring-2 transition-[box-shadow,opacity]', copies > 0 ? 'ring-primary' : 'opacity-60 ring-transparent')}>
                                            <CardTile card={e.card}></CardTile>
                                            {copies > 0 && (
                                                <span className='numeric absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-primary text-micro font-bold text-ink-inverse shadow-card'>
                                                    {copies}
                                                </span>
                                            )}
                                        </div>
                                        <span className='block w-full truncate text-micro text-ink-muted' title={e.card.name}>
                                            {e.card.name}
                                        </span>
                                        <Stepper
                                            itemLabel={e.card.name}
                                            decrementLabel={`One less copy of ${e.card.name}`}
                                            incrementLabel={`One more copy of ${e.card.name}`}
                                            onDecrement={() => setDraft((d) => setProxyCopies(d, e, copies - 1))}
                                            onIncrement={() => setDraft((d) => setProxyCopies(d, e, copies + 1))}
                                            decrementDisabled={copies === 0}
                                            incrementDisabled={copies >= e.quantity}
                                        >
                                            {copies}/{e.quantity}
                                        </Stepper>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}