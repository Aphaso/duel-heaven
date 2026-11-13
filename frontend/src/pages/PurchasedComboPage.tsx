import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { getPurchasedCombo } from '../api';
import ComboPlayer from '../components/ComboPlayer';

export default function PurchasedComboPage() {
    const { playlistId, comboId } = useParams<{ playlistId: string; comboId: string}>();

    const combo = useQuery({
        queryKey: ['purchased-combo', playlistId, comboId],
        queryFn: () => getPurchasedCombo(playlistId!, comboId!),
        enabled: !!playlistId && !!comboId,
    });

    return (
        <main className='mx-auto max-w-6xl p-8'>
            <Link to={`/purchases/${playlistId}`} className='text-sm text-blue-700 hover:underline'>
                ← Back to the Playlist
            </Link>

            {combo.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {combo.isError && <p className='mt-4 text-red-600'>{combo.error.message}</p>}

            {combo.data && (
                <>
                    <div className='mt-2'>
                        <h1 className='text-2xl font-bold'>{combo.data.name}</h1>
                        {combo.data.description && (
                            <p className='mt-1 text-gray-700'>{combo.data.description}</p>
                        )}
                        <p className='mt-1 text-xs text-gray-500'>Read-only: this Combo belongs to the Seller.</p>
                    </div>
                    <div className='mt-6'>
                        <ComboPlayer key={combo.data.id} combo={combo.data}></ComboPlayer>
                    </div>
                </>
            )}
        </main>
    );
}