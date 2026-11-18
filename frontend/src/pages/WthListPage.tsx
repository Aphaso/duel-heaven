import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { listWthGuides } from '../api';
import { Badge } from '../ui/Badge';
import { PlusIcon, ShieldIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { EmptyState, ErrorMessage, LoadingState } from '../ui/States';
import { buttonStyles } from '../ui/styles';

export default function WthListPage() {
    const guides = useQuery({ queryKey: ['wth-list'], queryFn: listWthGuides });

    return (
        <Page>
            <PageHeader
                eyebrow='Where to Handtrap?'
                title='WTH? Guides'
                description='For every Deck you fear: which of its cards to stop, and with which handtrap.'
                actions={
                    <Link to='/wth/new' className={buttonStyles({ variant: 'primary' })}>
                        <PlusIcon className='size-4' />
                        New Guide
                    </Link>
                }
            ></PageHeader>

            {guides.isPending && <LoadingState></LoadingState>}
            {guides.isError && <ErrorMessage>{guides.error.message}</ErrorMessage>}
            {guides.data?.length === 0 && (
                <EmptyState
                    icon={<ShieldIcon />}
                    title='No Guides yet'
                    description='Create one for the first Deck you fear.'
                    action={<Link to='/wth/new' className={buttonStyles({ variant: 'primary' })}><PlusIcon className='size-4' />New Guide</Link>}
                ></EmptyState>
            )}

            {guides.data && guides.data.length > 0 && (
                <ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                    {guides.data.map((g) => (
                        <li key={g.id}>
                            <Link
                                to={`/wth/${g.id}`}
                                className='focus-ring group flex h-full flex-col gap-3 rounded-panel border border-line bg-surface-raised p-panel shadow-panel transition-colors hover:border-danger/40'
                            >
                                <span className='flex items-start gap-3'>
                                    <span aria-hidden='true' className='grid size-10 shrink-0 place-items-center rounded-control border border-danger/30 bg-danger/10 text-danger'>
                                        <ShieldIcon className='size-5' />
                                    </span>
                                    <span className='min-w-0 flex-1'>
                                        <span className='label block text-ink-faint'>Vs</span>
                                        <span className='block truncate font-display text-heading text-ink group-hover:text-danger-hover'>{g.opponentDeckName}</span>
                                    </span>
                                </span>
                                {g.notes && <span className='line-clamp-2 text-sm text-ink-subtle'>{g.notes}</span>}
                                <span className='mt-auto flex items-center justify-between gap-2 pt-1'>
                                    <Badge tone='danger'>
                                        {g._count.entries} Opponent Card{g._count.entries === 1 ? '' : 's'}
                                    </Badge>
                                    <span className='text-caption text-ink-faint'>{new Date(g.updatedAt).toLocaleDateString('it-IT')}</span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Page>
    );
}