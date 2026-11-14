import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { getConnectStatus, startOnboarding } from '../api';

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

    if (status.isPending) {
        return <p className='p-8'>Loading...</p>;
    }
    if (status.isError) {
        return <p className='p-8 text-red-600'>{status.error.message}</p>;
    }

    const { connected, ready, feePercent } = status.data;

    return (
        <main className='mx-auto max-w-2xl space-y-4 px-8 py-6'>
            <h1 className='text-2xl font-semibold'>Payments</h1>

            {expired && !ready && (
                <p className='rounded bg-amber-50 p-3 text-sm text-amber-800'>
                    The previous setup link expired. Press the button below to get a new one.
                </p>
            )}

            {ready ? (
                <section className='space-y-2 rounded border border-green-300 bg-green-50 p-4'>
                    <h2 className='font-semibold text-green-800'>Your payments account is ready</h2>
                    <p className='text-sm'>
                        You can sell Playlists in the Store. When someone buys one, the money goes to your
                        Stripe account and the platform keeps {feePercent}%.
                    </p>
                </section>
            ) : (
                <section className='space-y-3 rounded border p-4'>
                    <h2 className='font-semibold'>
                        {connected ? 'Finish setting up your payments account' : 'Get paid for your Playlists'}
                    </h2>
                    <p className='text-sm text-gray-700'>
                        To sell Playlists you need a payments account. Stripe collects your details on its own
                        page: we never see or store them. The platform keeps {feePercent}% of each sale.
                    </p>
                    {connected && (
                        <p className='text-sm text-gray-600'>
                            Your account exists but cannot receive payments yet: the setup is not finished or
                            Stripe is still checking it.
                        </p>
                    )}
                    <div className='flex flex-wrap items-center gap-2'>
                        <button
                            type='button'
                            onClick={() => onboarding.mutate()}
                            disabled={onboarding.isPending}
                            className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50'
                        >
                            {onboarding.isPending
                                ? 'Redirecting...'
                                : connected
                                  ? 'Continue setup'
                                  : 'Connect with Stripe'}
                        </button>
                        {connected && (
                            <button
                                type='button'
                                onClick={() => void status.refetch()}
                                disabled={status.isFetching}
                                className='rounded border px-4 py-2 disabled:opacity-50'
                            >
                                {status.isFetching ? 'Checking...' : 'Check again'}
                            </button>
                        )}
                    </div>
                    {onboarding.isError && (
                        <p role='alert' className='text-sm text-red-600'>{onboarding.error.message}</p>
                    )}
                </section>
            )}
        </main>
    );
}