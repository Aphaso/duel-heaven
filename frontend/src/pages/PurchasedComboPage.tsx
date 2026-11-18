import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { getPurchasedCombo } from '../api';
import ComboPlayer from '../components/ComboPlayer';
import { Badge } from '../ui/Badge';
import { ChevronLeftIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { ErrorMessage, LoadingState } from '../ui/States';

export default function PurchasedComboPage() {
    const { playlistId, comboId } = useParams<{ playlistId: string; comboId: string}>();

    const combo = useQuery({
        queryKey: ['purchased-combo', playlistId, comboId],
        queryFn: () => getPurchasedCombo(playlistId!, comboId!),
        enabled: !!playlistId && !!comboId,
    });

    return (
        <Page className='space-y-6'>
            <Link to={`/purchases/${playlistId}`} className='focus-ring inline-flex items-center gap-1 rounded-control text-sm text-ink-subtle hover:text-primary'>
                <ChevronLeftIcon className='size-4' />
                Back to the Playlist
            </Link>

            {combo.isPending && <LoadingState></LoadingState>}
            {combo.isError && <ErrorMessage>{combo.error.message}</ErrorMessage>}

            {combo.data && (
                <>
                    <PageHeader
                        eyebrow='Purchased Combo'
                        title={combo.data.name}
                        description={combo.data.description ?? undefined}
                        actions={<Badge>Read-only: this Combo belongs to the Seller</Badge>}
                    ></PageHeader>
                    <ComboPlayer key={combo.data.id} combo={combo.data}></ComboPlayer>
                </>
            )}
        </Page>
    );
}