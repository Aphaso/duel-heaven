import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { duplicateCombo, listCombos } from '../api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { BoltIcon, CopyIcon, PlusIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { EmptyState, ErrorMessage, LoadingState } from '../ui/States';
import { buttonStyles } from '../ui/styles';

export default function ComboListPage() {
    const combos = useQuery({ queryKey: ['combos'], queryFn: listCombos });
    const queryClient = useQueryClient();
    const duplicate = useMutation({
        mutationFn: duplicateCombo,
        // The copy appears at the top of the list
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['combos'] }),
    });

    return (
        <Page>
            <PageHeader
                eyebrow='Combo Lab'
                title='Combos'
                description='Record your lines step by step on the field and replay them whenever you want.'
                actions={
                    <Link to='/combos/new' className={buttonStyles({ variant: 'primary' })}>
                        <PlusIcon className='size-4' />
                        New Combo
                    </Link>
                }
            ></PageHeader>

            {combos.isPending && <LoadingState></LoadingState>}
            {combos.isError && <ErrorMessage>{combos.error.message}</ErrorMessage>}
            {duplicate.isError && <ErrorMessage>{duplicate.error.message}</ErrorMessage>}
            {combos.data?.length === 0 && (
                <EmptyState
                    icon={<BoltIcon />}
                    title='No Combos yet.'
                    description='Pick a decklist and a starting hand, then record every move on the field.'
                    action={<Link to='/combos/new' className={buttonStyles({ variant: 'primary' })}><PlusIcon className='size-4' />New Combo</Link>}
                ></EmptyState>
            )}

            {combos.data && combos.data.length > 0 && (
                <ul className='grid gap-3 md:grid-cols-2'>
                    {combos.data.map((c) => (
                        <li key={c.id} className='group flex rounded-panel border border-line bg-surface-raised shadow-panel transition-colors hover:border-arcane-800'>
                            <Link to={`/combos/${c.id}`} className='focus-ring flex min-w-0 flex-1 items-start gap-4 rounded-l-panel p-panel'>
                                <span aria-hidden='true' className='grid size-11 shrink-0 place-items-center rounded-control border border-arcane-800 bg-arcane-950 text-secondary'>
                                    <BoltIcon className='size-5' />
                                </span>
                                <span className='min-w-0 flex-1 space-y-1'>
                                    <span className='block truncate font-display text-heading text-ink group-hover:text-arcane-300'>{c.name}</span>
                                    {c.description && <span className='line-clamp-2 block text-sm text-ink-subtle'>{c.description}</span>}
                                    <span className='flex items-center gap-3 pt-1'>
                                        <Badge tone='secondary'>
                                            {c.stepCount} step{c.stepCount === 1 ? '' : 's'}
                                        </Badge>
                                        <span className='text-caption text-ink-faint'>
                                            Updated on {new Date(c.updatedAt).toLocaleDateString('it-IT')}
                                        </span>
                                    </span>
                                </span>
                            </Link>
                            <div className='flex items-start border-l border-line p-2'>
                                <Button
                                    size='icon'
                                    variant='ghost'
                                    disabled={duplicate.isPending}
                                    loading={duplicate.isPending && duplicate.variables === c.id}
                                    onClick={() => duplicate.mutate(c.id)}
                                    aria-label={`Duplicate ${c.name}`}
                                    title='Duplicate'
                                >
                                    {!(duplicate.isPending && duplicate.variables === c.id) && <CopyIcon className='size-4' />}
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Page>
    );
}