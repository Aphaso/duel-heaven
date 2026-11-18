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
        <div className='space-y-4'>
            <div className='mt-4 flex flex-wrap items-center gap-3'>
                <p className='text-sm text-gray-700'>
                    <span className='font-semibold'>{total}</span> card{total === 1 ? '' : 's'}
                    {total > 0 && ` · ${pages} A4 page${pages === 1 ? '' : 's'}`}
                </p>
                <button
                    type='button'
                    onClick={() => setDraft(selectAllProxies(entries))}
                    disabled={entries.length === 0}
                    className='rounded border px-3 py-1 text-sm disabled:opacity-40'
                >
                    Select All
                </button>
                <button
                    type='button'
                    onClick={() => setDraft({})}
                    disabled={total === 0}
                    className='rounded border px-3 py-1 text-sm disabled:opacity-40'
                >
                    Clear
                </button>
                <button
                    type='button'
                    onClick={() => download.mutate()}
                    disabled={total === 0 || download.isPending}
                    className='rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40'
                >
                    {download.isPending ? 'Creating PDF...' : 'Download PDF'}
                </button>
            </div>
            <p className='text-xs text-gray-500'>
                Every Card is printed at 59 × 86 mm, 9 per A4 page, with a small gap to cut them out.
            </p>

            {decklistDirty && (
                <p className='rounded bg-yellow-100 p-2 text-sm'>
                    The Decklist has unsaved changes. The proxies use the saved Decklist.
                </p>
            )}
            {download.isError && (
                <p role='alert' className='whitespace-pre-line text-sm text-red-700'>
                    {download.error.message}
                </p>
            )}

            {entries.length === 0 && (
                <p className='text-sm text-gray-500'>The Decklist is empty: add Cards in the Decklist tab first.</p>
            )}

            {SECTIONS.map(({ id, label }) => {
                const rows = entries.filter((e) => e.section === id);
                if (rows.length === 0) {
                    return null;
                }
                return (
                    <section key={id} className='space-y-2'>
                        <h3 className='text-sm font-semibold'>{label}</h3>
                        <ul className='flex flex-wrap gap-3'>
                            {rows.map((e) => {
                                const copies = proxyCopies(draft, e);
                                return (
                                    <li
                                        key={proxyKey(e)}
                                        className={`w-24 rounded p-1 text-center ${
                                            copies > 0 ? 'bg-blue-50 ring-2 ring-blue-400' : ''
                                        }`}
                                    >
                                        <CardTile card={e.card}></CardTile>
                                        <span className='block truncate text-xs' title={e.card.name}>
                                            {e.card.name}
                                        </span>
                                        <div className='mt-1 flex items-center justify-center gap-1 text-sm'>
                                            <button
                                                type='button'
                                                disabled={copies === 0}
                                                aria-label={`One less copy of ${e.card.name}`}
                                                onClick={() => setDraft((d) => setProxyCopies(d, e, copies - 1))}
                                                className='rounded border px-1.5 disabled:opacity-30'
                                            >
                                                -
                                            </button>
                                            <span>
                                                {copies}/{e.quantity}
                                            </span>
                                            <button
                                                type='button'
                                                disabled={copies >= e.quantity}
                                                aria-label={`One more copy of ${e.card.name}`}
                                                onClick={() => setDraft((d) => setProxyCopies(d, e, copies + 1))}
                                                className='rounded border px-1.5 disabled:opacity-30'
                                            >
                                                +
                                            </button>
                                        </div>
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