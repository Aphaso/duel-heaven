import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { deletePlaylist, getCombo, getPlaylist } from '../api';
import { formatPrice } from '../price';
import ComboPlayer from '../components/ComboPlayer';
import { useConfirm } from '../confirm/useConfirm';
import PlaylistCover from '../components/PlaylistCover';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, PlaylistIcon, TrashIcon } from '../ui/icons';
import { Page } from '../ui/PageHeader';
import { Panel } from '../ui/Panel';
import { EmptyState, ErrorMessage, LoadingState } from '../ui/States';
import { buttonStyles, cn } from '../ui/styles';

export default function PlaylistPage() {
    const { id } = useParams<{ id: string }>();
    return <PlaylistScreen key={id} id={id} />;
}

function PlaylistScreen({ id }: { id: string | undefined }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [index, setIndex] = useState(0);
    const confirm = useConfirm();

    const playlist = useQuery({
        queryKey: ['playlist', id],
        queryFn: () => getPlaylist(id!),
        enabled: !!id,
    });

    // Derived: the combo that is playing (the index can never point outside the list)
    const rows = playlist.data?.combos ?? [];
    const current = rows[Math.min(index, rows.length - 1)];
    const currentIndex = current ? rows.indexOf(current) : -1;

    // Only the combo that is playing is downloaded
    const combo = useQuery({
        queryKey: ['combo', current?.comboId],
        queryFn: () => getCombo(current!.comboId),
        enabled: !!current,
    });

    const remove = useMutation({
        mutationFn: () => deletePlaylist(id!),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['playlists'] });
            await queryClient.invalidateQueries({ queryKey: ['store'] });
            navigate('/playlists');
        },
    });

    async function askDelete(name: string, buyers: number) {
        const confirmed = await confirm({
            title: `Delete "${name}"?`,
            message:
                buyers > 0
                    ? `It has been bought by ${buyers} ${buyers === 1 ? 'person' : 'people'}. They keep a frozen copy of its last version, but it disappears for you and from the Store.\nIts Combos are kept.`
                    : 'Its Combos are kept.',
                confirmLabel: 'Delete',
                destructive: true,
        });
        if (confirmed) {
            remove.mutate();
        }
    }

    return (
        <Page className='space-y-6'>
            <Link to='/playlists' className='focus-ring inline-flex items-center gap-1 rounded-control text-sm text-ink-subtle hover:text-primary'>
                <ChevronLeftIcon className='size-4' />
                All Playlists
            </Link>

            {playlist.isPending && <LoadingState></LoadingState>}
            {playlist.isError && <ErrorMessage>{playlist.error.message}</ErrorMessage>}

            {playlist.data && (
                <>
                    <header className='flex flex-wrap items-end gap-5'>
                        <PlaylistCover seed={playlist.data.id} className='size-24 shrink-0 shadow-overlay sm:size-32' />
                        <div className='min-w-0 flex-1 space-y-2'>
                            <p className='label text-primary'>Playlist</p>
                            <h1 className='font-display text-title break-words text-ink'>{playlist.data.name}</h1>
                            {playlist.data.description && <p className='text-sm text-ink-subtle'>{playlist.data.description}</p>}
                            <div className='flex flex-wrap items-center gap-2'>
                                <Badge>{rows.length} combo{rows.length === 1 ? '' : 's'}</Badge>
                                {playlist.data.isForSale && playlist.data.priceCents !== null && (
                                    <Badge tone='accent'>For sale at {formatPrice(playlist.data.priceCents)}</Badge>
                                )}
                                {playlist.data._count.purchases > 0 && (
                                    <span className='numeric text-caption text-success'>{playlist.data._count.purchases} sold</span>
                                )}
                            </div>
                        </div>
                        <div className='flex gap-2'>
                            <Button
                                size='sm'
                                variant='danger-ghost'
                                disabled={remove.isPending}
                                onClick={() => void askDelete(playlist.data.name, playlist.data._count.purchases)}
                            >
                                <TrashIcon className='size-4' />
                                Delete
                            </Button>
                            <Link to={`/playlists/${playlist.data.id}/edit`} className={buttonStyles({ variant: 'primary', size: 'sm' })}>
                                <PencilIcon className='size-4' />
                                Edit
                            </Link>
                        </div>
                    </header>
                    {remove.isError && <ErrorMessage>{remove.error.message}</ErrorMessage>}

                    {rows.length === 0 ? (
                        <EmptyState
                            icon={<PlaylistIcon />}
                            title='This Playlist is empty'
                            description='Use Edit to add Combos.'
                        ></EmptyState>
                    ) : (
                        <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]'>
                            <Panel title='Combos' flush className='self-start'>
                                <ol className='space-y-0.5 p-2'>
                                    {rows.map((row, i) => {
                                        const active = i === currentIndex;
                                        return (
                                            <li key={row.id}>
                                                <button
                                                    type='button'
                                                    onClick={() => setIndex(i)}
                                                    aria-current={active ? 'true' : undefined}
                                                    className={cn(
                                                        'focus-ring flex w-full items-center gap-3 rounded-control px-2 py-2 text-left text-sm transition-colors',
                                                        active ? 'bg-aether-950 text-ink' : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
                                                    )}
                                                >
                                                    <span className={cn('numeric w-5 shrink-0 text-center text-caption', active ? 'text-primary' : 'text-ink-faint')}>
                                                        {active ? '▶' : i + 1}
                                                    </span>
                                                    <span className={cn('min-w-0 flex-1 truncate', active && 'font-semibold')}>{row.combo.name}</span>
                                                    <span className='numeric shrink-0 text-micro text-ink-faint'>{row.combo.stepCount}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </Panel>

                            <div className='min-w-0 space-y-4'>
                                <div className='flex flex-wrap items-center justify-between gap-3'>
                                    <div className='min-w-0'>
                                        <p className='label text-ink-faint'>
                                            Combo <span className='numeric'>{currentIndex + 1} / {rows.length}</span>
                                        </p>
                                        <h2 className='truncate font-display text-heading text-ink'>{current?.combo.name}</h2>
                                    </div>
                                    <div className='flex gap-2'>
                                        <Button size='sm' disabled={currentIndex <= 0} onClick={() => setIndex(currentIndex - 1)}>
                                            <ChevronLeftIcon className='size-4' />
                                            Previous Combo
                                        </Button>
                                        <Button size='sm' disabled={currentIndex >= rows.length - 1} onClick={() => setIndex(currentIndex + 1)}>
                                            Next Combo
                                            <ChevronRightIcon className='size-4' />
                                        </Button>
                                    </div>
                                </div>

                                {combo.isPending && <LoadingState></LoadingState>}
                                {combo.isError && <ErrorMessage>{combo.error.message}</ErrorMessage>}
                                {combo.data && <ComboPlayer key={combo.data.id} combo={combo.data}></ComboPlayer>}
                            </div>
                        </div>
                    )}
                </>
            )}
        </Page>
    );
}