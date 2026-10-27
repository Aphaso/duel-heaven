import { useEffect, useState } from 'react';

export default function App() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/cards?limit=1').then((res) => res.json()).then((data) => setTotal(data.total));
  }, []);

  return (
    <main className='p-8'>
      <h1 className='text-3xl font-bold'>Duel Heaven</h1>
      <p className='mt-2 text-gray-600'>
        {total === null
          ? 'Connessione al backend...'
          : `Carte nel database: ${total}`}
      </p>
    </main>
  );
}