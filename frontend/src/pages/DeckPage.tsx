import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { Link, useParams } from 'react-router';
import { getDeck } from '../api';
import DeckDetailsForm from '../components/DeckDetailsForm';
import DeckEditor from '../components/DeckEditor';
import SidePatternsPanel from '../components/SidePatternsPanel';
import { useConfirm } from '../confirm/useConfirm';
import ProxiesPanel from '../components/ProxiesPanel';
import { ChevronLeftIcon, DeckIcon, PrinterIcon, SwapIcon } from '../ui/icons';
import { Page } from '../ui/PageHeader';
import { ErrorMessage, LoadingState } from '../ui/States';
import { Tabs, type TabItem } from '../ui/Tabs';

type Tab = 'decklist' | 'side-patterns' | 'proxies';

const TABS: { id: Tab; label: string; icon: TabItem<Tab>['icon'] }[] = [
    { id: 'decklist', label: 'Decklist', icon: DeckIcon },
    { id: 'side-patterns', label: 'Side Patterns', icon: SwapIcon },
    { id: 'proxies', label: 'Proxies', icon: PrinterIcon },
];

export default function DeckPage() {
    const { id } = useParams<{ id: string }>();
    const [tab, setTab] = useState<Tab>('decklist');
    const confirm = useConfirm();

    const [listDirty, setListDirty] = useState(false);
    const [patternDirty, setPatternDirty] = useState(false);

    // The page navigation guard
    useUnsavedChangesGuard(listDirty || patternDirty);

    async function selectTab(next: Tab) {
        if (next === tab) {
            return;
        }

        /**
         * The Decklist editor stays mounted even if hidden, so the draft survives a tab change.
         * The Side Pattern editor is unmounted on leave, so we ask first.
         */
        if (patternDirty && !(await confirm({
            title: 'Discard changes?',
            message: 'Your changes to this Side Pattern will be lost.',
            confirmLabel: 'Discard',
            destructive: true,
        }))) {
            return;
        }
        setTab(next);
    }

    const deck = useQuery({
        queryKey: ['deck', id],
        queryFn: () => getDeck(id!),
        enabled: !!id,
    });

    return (
        <Page className='space-y-6'>
            <Link to='/decks' className='focus-ring inline-flex items-center gap-1 rounded-control text-sm text-ink-subtle hover:text-primary'>
                <ChevronLeftIcon className='size-4' />
                All Decks
            </Link>

            {deck.isPending && <LoadingState></LoadingState>}
            {deck.isError && <ErrorMessage>{deck.error.message}</ErrorMessage>}

            {deck.data && (
                <>
                    <DeckDetailsForm deck={deck.data}></DeckDetailsForm>

                    <Tabs
                        label='Deck sections'
                        tabs={TABS.map((t) => ({
                            ...t,
                            dot: (t.id === 'decklist' && listDirty) || (t.id === 'side-patterns' && patternDirty),
                        }))}
                        value={tab}
                        onChange={(next) => void selectTab(next)}
                    ></Tabs>

                    {/* The editor stays mounted but hidden: unmounting it would throw away the unsaved draft */}
                    <div role='tabpanel' className={tab === 'decklist' ? '' : 'hidden'}>
                        <DeckEditor key={deck.data.id} deck={deck.data} onDirtyChange={setListDirty}></DeckEditor>
                    </div>

                    {tab === 'side-patterns' && (
                        <div role='tabpanel'>
                            <SidePatternsPanel key={deck.data.id} deck={deck.data} decklistDirty={listDirty} onDirtyChange={setPatternDirty}></SidePatternsPanel>
                        </div>
                    )}
                    {/* Always mounted but hidden: the choice of the Cards survives a change of tab */}
                    <div role='tabpanel' className={tab === 'proxies' ? '' : 'hidden'}>
                        <ProxiesPanel key={deck.data.id} deck={deck.data} decklistDirty={listDirty}></ProxiesPanel>
                    </div>
                </>
            )}
        </Page>
    );
}