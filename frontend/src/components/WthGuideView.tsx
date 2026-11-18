import type { WthGuide } from '../types';
import CardTile from './CardTile';
import { WthMatchup } from './WthMatchup';
import { ShieldIcon } from '../ui/icons';
import { EmptyState } from '../ui/States';

export default function WthGuideView({ guide }: { guide: WthGuide }) {
    return (
        <div className='space-y-4'>
            {guide.notes && (
                <p className='rounded-control border-l-2 border-primary bg-aether-950/40 px-4 py-3 text-sm whitespace-pre-line text-ink-muted'>{guide.notes}</p>
            )}
            {guide.entries.length === 0 && (
                <EmptyState icon={<ShieldIcon />} title='No Opponent Cards yet' description='Edit the guide to add the cards to stop.'></EmptyState>
            )}
            {guide.entries.map((entry, i) => (
                <WthMatchup
                    key={entry.id}
                    index={i + 1}
                    target={entry.targetCard}
                    responses={
                        <ul className='flex flex-wrap gap-3'>
                            {entry.responses.map((r) => (
                                <li key={r.id} className='w-card-md'>
                                    <CardTile card={r.card}></CardTile>
                                    <p className='mt-1 truncate text-center text-micro text-ink-muted' title={r.card.name}>
                                        {r.card.name}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    }
                    footer={entry.notes ? <p className='text-sm whitespace-pre-line text-ink-muted'>{entry.notes}</p> : undefined}
                ></WthMatchup>
            ))}
        </div>
    );
}
