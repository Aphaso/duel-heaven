import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { createCombo, getCombo, updateCombo } from '../api';
import ComboEditor from '../components/ComboEditor';
import { draftFromCombo, emptyComboDraft, toComboPayload, type ComboDraft } from '../comboDraft';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';

export default function ComboEditPage() {
    const { id } = useParams<{ id: string }>();
    return <ComboEditScreen key={id ?? 'new'} id={id} />;
}

function ComboEditScreen({ id }: { id: string | undefined }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [dirty, setDirty] = useState(false);

    const comboQuery = useQuery({
        queryKey: ['combo', id],
        queryFn: () => getCombo(id!),
        enabled: !!id,
    });

    const save = useMutation({
        mutationFn: (draft: ComboDraft) => {
            const payload = toComboPayload(draft);
            return id ? updateCombo(id, payload) : createCombo(payload);
        },
        onSuccess: async (saved) => {
            queryClient.setQueryData(['combo', saved.id], saved);
            await queryClient.invalidateQueries({ queryKey: ['combos'] });
            navigate(`/combos/${saved.id}`, { replace: true });
        },
    });

    // The only navigation guard of this page. While saving there is nothing to protect:
    // we navigate while the mutation is still "pending".
    useUnsavedChangesGuard(dirty && !save.isPending);

    const combo = comboQuery.data;

    return (
        <main className='mx-auto max-w-6xl p-8'>
            <Link to={id ? `/combos/${id}` : '/combos'} className='text-sm text-blue-700 hover:underline'>
                ← Back
            </Link>

            {id && comboQuery.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {id && comboQuery.isError && <p className='mt-4 text-red-600'>{comboQuery.error.message}</p>}

            {(!id || combo) && (
                <>
                    <h1 className='mt-2 text-2xl font-bold'>{combo ? `Edit: ${combo.name}` : 'New Combo'}</h1>
                    <div className='mt-4'>
                        <ComboEditor
                            initial={combo ? draftFromCombo(combo) : emptyComboDraft()}
                            saving={save.isPending}
                            error={save.isError ? save.error.message : null}
                            onSave={(draft) => save.mutate(draft)}
                            onDirtyChange={setDirty}
                        >
                        </ComboEditor>
                    </div>
                </>
            )}
        </main>
    );
}