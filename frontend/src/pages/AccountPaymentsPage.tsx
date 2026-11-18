import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { getConnectStatus, startOnboarding } from '../api';
import { Button } from '../ui/Button';
import { CheckIcon, WalletIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { ErrorMessage, LoadingState, Notice } from '../ui/States';
import { cn } from '../ui/styles';

export default function AccountPaymentsPage() {
    const [params] = useSearchParams();
    // Stripe sends the user back here with ?refresh=1 when the setup link has expired
    const expired = params.get('refresh') === '1';

    const status = useQuery({ queryKey: ['connect-status'], queryFn: getConnectStatus });

    const onboarding = useMutation({
        mutationFn: startOnboarding,
        // We leave the app: the setup form belongs to Stripe
        onSuccess: ({ url }) => window.location.assign(url),
    });

    const header = (
        <PageHeader
            eyebrow='Settings'
            title='Payments'
            description='Sell your Playlists in the Store and get paid through Stripe.'
        ></PageHeader>
    );

    if (status.isPending) {
        return (
            <Page width='narrow'>
                {header}
                <LoadingState></LoadingState>
            </Page>
        );
    }
    if (status.isError) {
        return (
            <Page width='narrow'>
                {header}
                <ErrorMessage>{status.error.message}</ErrorMessage>
            </Page>
        );
    }

    const { connected, ready, feePercent } = status.data;

    return (
        <Page width='narrow'>
            {header}

            {expired && !ready && (
                <Notice>The previous setup link expired. Press the button below to get a new one.</Notice>
            )}

            {/* Progress of the setup: account created → ready to receive payments */}
            <ol className='grid grid-cols-2 gap-3'>
                {[
                    { label: 'Account created', done: connected },
                    { label: 'Ready to get paid', done: ready },
                ].map((stepItem, i) => (
                    <li
                        key={stepItem.label}
                        className={cn(
                            'flex items-center gap-3 rounded-panel border px-4 py-3',
                            stepItem.done ? 'border-success/40 bg-success/5' : 'border-line bg-surface-raised',
                        )}
                    >
                        <span
                            className={cn(
                                'numeric grid size-7 shrink-0 place-items-center rounded-full text-caption font-bold',
                                stepItem.done ? 'bg-success text-ink-inverse' : 'border border-line-strong text-ink-faint',
                            )}
                        >
                            {stepItem.done ? <CheckIcon className='size-4' /> : i + 1}
                        </span>
                        <span className={cn('text-sm font-semibold', stepItem.done ? 'text-ink' : 'text-ink-subtle')}>{stepItem.label}</span>
                    </li>
                ))}
            </ol>

            {ready ? (
                <section className='space-y-2 rounded-panel border border-success/40 bg-success/5 p-panel'>
                    <h2 className='flex items-center gap-2 font-display text-heading text-success'>
                        <CheckIcon className='size-5' />
                        Your payments account is ready
                    </h2>
                    <p className='text-sm text-ink-muted'>
                        You can sell Playlists in the Store. When someone buys one, the money goes to your
                        Stripe account and the platform keeps <span className='numeric text-ink'>{feePercent}%</span>.
                    </p>
                </section>
            ) : (
                <section className='holo-border space-y-4 rounded-panel p-panel shadow-panel'>
                    <div className='flex items-start gap-3'>
                        <span className='grid size-10 shrink-0 place-items-center rounded-control bg-relic-950 text-accent'>
                            <WalletIcon className='size-5' />
                        </span>
                        <div className='space-y-1'>
                            <h2 className='font-display text-heading text-ink'>
                                {connected ? 'Finish setting up your payments account' : 'Get paid for your Playlists'}
                            </h2>
                            <p className='text-sm text-ink-muted'>
                                To sell Playlists you need a payments account. Stripe collects your details on its own
                                page: we never see or store them. The platform keeps <span className='numeric text-ink'>{feePercent}%</span> of each sale.
                            </p>
                        </div>
                    </div>
                    {connected && (
                        <Notice tone='info'>
                            Your account exists but cannot receive payments yet: the setup is not finished or
                            Stripe is still checking it.
                        </Notice>
                    )}
                    <div className='flex flex-wrap items-center gap-2'>
                        <Button variant='accent' onClick={() => onboarding.mutate()} loading={onboarding.isPending}>
                            {onboarding.isPending
                                ? 'Redirecting...'
                                : connected
                                  ? 'Continue setup'
                                  : 'Connect with Stripe'}
                        </Button>
                        {connected && (
                            <Button onClick={() => void status.refetch()} disabled={status.isFetching}>
                                {status.isFetching ? 'Checking...' : 'Check again'}
                            </Button>
                        )}
                    </div>
                    {onboarding.isError && <ErrorMessage>{onboarding.error.message}</ErrorMessage>}
                </section>
            )}
        </Page>
    );
}