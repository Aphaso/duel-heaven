import { Button } from '../ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/icons';

interface Props {
    page: number;
    totalPages: number;
    disabled?: boolean;
    onChange: (page: number) => void;
}

export default function Pagination({
    page,
    totalPages,
    disabled,
    onChange,
}: Props) {
    if (totalPages <= 1) {
        return null;
    }
    return (
        <nav aria-label='Pagination' className='mt-4 flex items-center justify-center gap-3'>
            <Button size='sm' disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
                <ChevronLeftIcon className='size-4' />
                Previous
            </Button>
            <span className='numeric text-caption text-ink-subtle'>
                Page <span className='text-ink'>{page}</span> of {totalPages}
            </span>
            <Button size='sm' disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>
                Next
                <ChevronRightIcon className='size-4' />
            </Button>
        </nav>
    );
}
