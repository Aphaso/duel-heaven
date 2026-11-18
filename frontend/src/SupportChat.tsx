import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';
import { askSupport } from './api';
import type { SupportReply } from './types';
import { Button } from './ui/Button';
import { Input } from './ui/Field';
import { ChatIcon, CloseIcon, SendIcon } from './ui/icons';
import { Spinner } from './ui/Spinner';
import { linkStyles } from './ui/styles';

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
                className='focus-ring fixed right-4 bottom-20 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-display text-sm font-semibold text-ink-inverse shadow-overlay transition-shadow hover:bg-primary-hover hover:shadow-glow-primary lg:right-6 lg:bottom-6'
            >
                <ChatIcon className='size-5' />
                Help
            </button>
        );
    }

    return (
        <section
            aria-label='Support chat'
            className='fixed inset-x-3 bottom-20 z-50 flex h-[min(32rem,calc(100dvh-7rem))] animate-rise-in flex-col overflow-hidden rounded-panel border border-line bg-surface-overlay shadow-overlay sm:inset-x-auto sm:right-4 sm:w-96 lg:right-6 lg:bottom-6'
        >
            <header className='flex items-center gap-3 border-b border-line bg-surface-raised px-4 py-3'>
                <span className='grid size-8 place-items-center rounded-full bg-aether-950 text-primary'>
                    <ChatIcon className='size-4' />
                </span>
                <div className='min-w-0 flex-1'>
                    <h2 className='font-display text-sm font-semibold text-ink'>Support</h2>
                    <p className='text-micro text-ink-subtle'>Decks, combos, playlists, store and payments</p>
                </div>
                <button
                    type='button'
                    onClick={() => setOpen(false)}
                    aria-label='Close Support Chat'
                    className='focus-ring grid size-8 place-items-center rounded-control text-ink-subtle hover:bg-surface-hover hover:text-ink'
                >
                    <CloseIcon className='size-4' />
                </button>
            </header>

            <div className='scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-4' aria-live='polite'>
                {messages.map((message) => (
                    <div key={message.id} className={message.from === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                        <div
                            className={
                                message.from === 'user'
                                    ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-ink-inverse'
                                    : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-surface-raised px-3.5 py-2 text-sm text-ink'
                            }
                        >
                            <p>{message.text}</p>
                            {message.link && (
                                <Link to={message.link.to} onClick={() => setOpen(false)} className={`mt-2 inline-block ${linkStyles}`}>
                                    {message.link.label} →
                                </Link>
                            )}
                        </div>
                    </div>
                ))}

                {ask.isPending && (
                    <p className='flex items-center gap-2 text-caption text-ink-subtle'>
                        <Spinner className='size-3.5' />
                        Typing...
                    </p>
                )}

                {suggestionsOf(last).length > 0 && !ask.isPending && (
                    <div className='flex flex-wrap gap-2'>
                        {suggestionsOf(last).map((suggestion) => (
                            <button
                                key={suggestion}
                                type='button'
                                onClick={() => send(suggestion)}
                                className='focus-ring rounded-full border border-aether-800 bg-aether-950/60 px-3 py-1 text-left text-caption text-aether-200 transition-colors hover:border-primary hover:text-ink'
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
                <div ref={bottomRef}></div>
            </div>

            <form onSubmit={handleSubmit} className='flex gap-2 border-t border-line bg-surface-raised p-3'>
                <Input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    maxLength={MAX_LENGTH}
                    placeholder='Ask a question...'
                    aria-label='Your question'
                    className='min-w-0 flex-1'
                ></Input>
                <Button
                    type='submit'
                    variant='primary'
                    size='icon'
                    aria-label='Send'
                    disabled={input.trim() === '' || ask.isPending}
                    className='size-10'
                >
                    <SendIcon className='size-4' />
                </Button>
            </form>
        </section>
    );
}

function suggestionsOf(message: ChatMessage | undefined): string[] {
    return message?.suggestions ?? [];
}
