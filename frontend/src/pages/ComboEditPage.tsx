import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { createCombo, getCombo, updateCombo } from '../api';
import ComboEditor from '../components/ComboEditor';
import { draftFromCombo, emptyComboDraft, toComboPayload, type ComboDraft } from '../comboDraft';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { ChevronLeftIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { ErrorMessage, LoadingState } from '../ui/States';

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
        <Page className='space-y-6'>
            <Link to={id ? `/combos/${id}` : '/combos'} className='focus-ring inline-flex items-center gap-1 rounded-control text-sm text-ink-subtle hover:text-primary'>
                <ChevronLeftIcon className='size-4' />
                Back
            </Link>

            {id && comboQuery.isPending && <LoadingState></LoadingState>}
            {id && comboQuery.isError && <ErrorMessage>{comboQuery.error.message}</ErrorMessage>}

            {(!id || combo) && (
                <>
                    <PageHeader eyebrow={combo ? 'Edit Combo' : 'Combo Lab'} title={combo ? combo.name : 'New Combo'}></PageHeader>
                    <ComboEditor
                        initial={combo ? draftFromCombo(combo) : emptyComboDraft()}
                        saving={save.isPending}
                        error={save.isError ? save.error.message : null}
                        onSave={(draft) => save.mutate(draft)}
                        onDirtyChange={setDirty}
                    >
                    </ComboEditor>
                </>
            )}
        </Page>
    );
}