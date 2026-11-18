import { useState, type SyntheticEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';
import { deleteAccount } from '../auth/authApi';
import { useAuth } from '../auth/useAuth';
import { Button } from '../ui/Button';
import { Field, Input } from '../ui/Field';
import { AlertIcon, ChevronRightIcon, WalletIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { ErrorMessage } from '../ui/States';
import { panelStyles } from '../ui/styles';

export default function AccountPage() {
    const { user, signOut } = useAuth();
    const [typed, setTyped] = useState('');

    const remove = useMutation({
        mutationFn: async (confirmation: string) => {
            await deleteAccount(confirmation);
            await signOut();
        },
    });

    if (!user) {
        return null;
    }

    // What the user must type: same rules as the ones in account-deletion.ts
    const expected = user.username ?? user.email ?? '';
    const matches = expected !== '' && typed.trim().toLowerCase() == expected.toLowerCase();

    function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        if (matches && !remove.isPending) {
            remove.mutate(typed);
        }
    }

    const initial = (user.displayName ?? user.username ?? user.email ?? '?').charAt(0).toUpperCase();

    return (
        <Page width='narrow'>
            <PageHeader eyebrow='Settings' title='Account'></PageHeader>

            <section className={`${panelStyles} overflow-hidden`}>
                <div className='flex items-center gap-4 border-b border-line bg-gradient-to-r from-aether-950 via-surface-raised to-arcane-950 p-panel'>
                    <span className='grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-aether-500 to-arcane-500 font-display text-title text-ink shadow-glow-primary'>
                        {initial}
                    </span>
                    <div className='min-w-0'>
                        <p className='truncate font-display text-heading text-ink'>{user.displayName ?? '-'}</p>
                        <p className='truncate text-sm text-ink-subtle'>{user.username ? `@${user.username}` : '-'}</p>
                    </div>
                </div>
                <dl className='divide-y divide-line'>
                    {[
                        { label: 'Username', value: user.username ?? '-' },
                        { label: 'Email', value: user.email ?? '-' },
                        { label: 'Name', value: user.displayName ?? '-' },
                    ].map((row) => (
                        <div key={row.label} className='flex items-center justify-between gap-4 px-panel py-3'>
                            <dt className='label text-ink-subtle'>{row.label}</dt>
                            <dd className='min-w-0 truncate text-sm text-ink'>{row.value}</dd>
                        </div>
                    ))}
                </dl>
                <Link
                    to='/account/payments'
                    className='focus-ring flex items-center gap-3 border-t border-line px-panel py-3 text-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink'
                >
                    <WalletIcon className='size-4 text-accent' />
                    <span className='flex-1'>Payments settings</span>
                    <ChevronRightIcon className='size-4 text-ink-faint' />
                </Link>
            </section>

            <section className='space-y-4 rounded-panel border border-danger/40 bg-danger/5 p-panel'>
                <div className='flex items-start gap-3'>
                    <span className='grid size-9 shrink-0 place-items-center rounded-full bg-danger/15 text-danger'>
                        <AlertIcon className='size-5' />
                    </span>
                    <div className='space-y-1'>
                        <h2 className='font-display text-heading text-danger'>Delete Account</h2>
                        <p className='text-sm text-ink-muted'>This cannot be undone. What happens:</p>
                    </div>
                </div>
                <ul className='list-disc space-y-1 pl-5 text-sm text-ink-muted marker:text-danger/70'>
                    <li>Your Decks, Combos, WTH? guides and the Playlists nobody bought are erased.</li>
                    <li>The Playlists you bought are removed from your account.</li>
                    <li>
                        Playlists that other people already bought stay available to them, without your
                        name, in the last versione they had.
                    </li>
                    <li>If you connected a payments account, it is closed.</li>
                </ul>
                <form onSubmit={handleSubmit} className='space-y-3'>
                    <Field label={<>To confirm, type <strong className='normal-case tracking-normal text-ink'>{expected}</strong></>}>
                        {(control) => (
                            <Input
                                {...control}
                                value={typed}
                                onChange={(event) => setTyped(event.target.value)}
                                autoComplete='off'
                                spellCheck={false}
                                className='border-danger/40 focus:border-danger'
                            >
                            </Input>
                        )}
                    </Field>
                    <Button type='submit' variant='danger' disabled={!matches} loading={remove.isPending}>
                        {remove.isPending ? 'Deleting...' : 'Delete my Account'}
                    </Button>
                    {remove.isError && <ErrorMessage>{remove.error.message}</ErrorMessage>}
                </form>
            </section>
        </Page>
    );
}