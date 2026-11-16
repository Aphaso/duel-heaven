import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';
import { askSupport } from './api';
import type { SupportReply } from './types';

const MAX_LENGTH = 300;

interface ChatMessage {
    id: string;
    from: 'user' | 'bot';
    text: string;
    link?: SupportReply['link'];
    suggestions?: string[];
}

const GREETING: ChatMessage = {
    id: 'greeting',
    from: 'bot',
    text: 'Hi Duelist! Ask me anything about decks, combos, playlists, the store or payments.',
    suggestions: [
        'How do I build a decklist?',
        'How do I create a combo?',
        'How do I sell a playlist?',
        'How do I buy a playlist?',
    ],
};

export function SupportChat() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    const ask = useMutation({
        mutationFn: askSupport,
        onSuccess: (reply) => {
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    from: 'bot',
                    text: reply.answer,
                    link: reply.link,
                    suggestions: reply.suggestions,
                },
            ]);
        },
        onError: () => {
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    from: 'bot',
                    text: 'Something went wrong while contacting support. Please try again.',
                },
            ]);
        },
    });

    // Keeps the last message visible
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' });
    }, [messages, open]);

    function send(text: string) {
        const trimmed = text.trim();
        if (trimmed === '' || ask.isPending) {
            return;
        }
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: 'user', text: trimmed }]);
        setInput('');
        ask.mutate(trimmed);
    }

    function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        send(input);
    }

    const last = messages[messages.length - 1];

    if (!open) {
        return (
            <button
                type='button'
                onClick={() => setOpen(true)}
                aria-label='Open Support Chat'
                className='fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-blue-700'
            >
                Help
            </button>
        );
    }

    return (
        <section aria-label='Support chat' className='fixed bottom-4 right-4 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl'>
            <header className='flex items-center justify-between border-b border-gray-200 px-3 py-2'>
                <h2 className='text-sm font-semibold text-gray-900'>Support</h2>
                <button
                    type='button'
                    onClick={() => setOpen(false)}
                    aria-label='Close Support Chat'
                    className='text-gray-500 hover:text-gray-900'
                >
                    ✕
                </button>
            </header>

            <div className='flex-1 space-y-3 overflow-y-auto px-3 py-3' aria-live='polite'>
                {messages.map((message) => (
                    <div key={message.id} className={message.from === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                        <div className={message.from === 'user' ? 'max-w-[85%] rounded-lg bg-blue-600 px-3 py-2 text-sm text-white' : 'max-w-[85%] rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-100'}>
                            <p>{message.text}</p>
                            {message.link && (
                                <Link to={message.link.to} onClick={() => setOpen(false)} className='mt-2 inline-block text-blue-700 underline hover:text-blue-900'>
                                    {message.link.label}
                                </Link>
                            )}
                        </div>
                    </div>
                ))}

                {ask.isPending && <p className='text-xs text-gray-500'>Typing...</p>}

                {suggestionsOf(last).length > 0 && !ask.isPending && (
                    <div className='flex flex-wrap gap-2'>
                        {suggestionsOf(last).map((suggestion) => (
                            <button
                                key={suggestion}
                                type='button'
                                onClick={() => send(suggestion)}
                                className='rounded-full border border-gray-300 px-3 py-1 text-left text-xs text-gray-700 hover:bg-gray-50'
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
                <div ref={bottomRef}></div>
            </div>

            <form onSubmit={handleSubmit} className='flex gap-2 border-t border-gray-200 p-'>
                <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    maxLength={MAX_LENGTH}
                    placeholder='Ask a question...'
                    aria-label='Your question'
                    className='min-w-0 flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900'
                >
                </input>
                <button
                    type='submit'
                    disabled={input.trim() === '' || ask.isPending}
                    className='rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50'
                >
                    Send
                </button>
            </form>
        </section>
    );
}

function suggestionsOf(message: ChatMessage | undefined): string[] {
    return message?.suggestions ?? [];
}
