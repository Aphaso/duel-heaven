interface Props {
    page: number;
    totalPages: number;
    disabled?: boolean;
    onChange: (page: number) => void;
}

const button = 'rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40';

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
        <nav className='mt-3 flex items-center justify-center gap-3 text-sm'>
            <button className={button} disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
                Previous
            </button>
            <span>
                Page {page} of {totalPages}
            </span>
            <button className={button} disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>
                Next
            </button>
        </nav>
    );
}