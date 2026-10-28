import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router';
import CardSearchPage from './pages/CardSearchPage';
import DeckPage from './pages/DeckPage';
import DecksPage from './pages/DecksPage';

function navClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'font-semibold text-blue-700'
    : 'text-gray-600 hover:text-gray-900';
}

export default function App() {
  return (
    <BrowserRouter>
      <header className='border-b border-gray-200'>
        <nav className='mx-auto flex max-w-6xl items-center gap-6 px-8 py-3'>
          <span className='font-bold'>Duel Heaven</span>
          <NavLink to='/cards' className={navClass}>Cards</NavLink>
          <NavLink to='/decks' className={navClass}>Decks</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path='/' element={<Navigate to ="/cards" replace></Navigate>}></Route>
        <Route path='/cards' element={<CardSearchPage></CardSearchPage>}></Route>
        <Route path='/decks' element={<DecksPage></DecksPage>}></Route>
        <Route path='/decks/:id' element={<DeckPage></DeckPage>}></Route>
        <Route path='*' element={<p className='p-8'></p>}>Page Not Found.</Route>
      </Routes>
    </BrowserRouter>
  );
}