import { createBrowserRouter, Navigate, NavLink, Outlet, RouterProvider } from 'react-router';
import CardSearchPage from './pages/CardSearchPage';
import DeckPage from './pages/DeckPage';
import DecksPage from './pages/DecksPage';
import WthListPage from './pages/WthListPage';
import WthGuidePage from './pages/WthGuidePage';
import ComboListPage from './pages/ComboListPage';
import ComboPage from './pages/ComboPage';
import ComboEditPage from './pages/ComboEditPage';
import PlaylistListPage from './pages/PlaylistListPage';
import PlaylistEditPage from './pages/PlaylistEditPage';
import PlaylistPage from './pages/PlaylistPage';

function navClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'font-semibold text-blue-700'
    : 'text-gray-600 hover:text-gray-900';
}

/** Bar on top + point where the page chosen by the router is shown. */
function Layout() {
  return (
    <>
      <header className='border-b border-gray-200'>
        <nav className='mx-auto flex max-w-6xl items-center gap-6 px-8 py-3'>
          <span className='font-bold'>Duel Heaven</span>
          <NavLink to='/cards' className={navClass}>Cards</NavLink>
          <NavLink to='/decks' className={navClass}>Decks</NavLink>
          <NavLink to='/wth' className={navClass}>WTH?</NavLink>
          <NavLink to='/combos' className={navClass}>Combos</NavLink>
          <NavLink to='/playlists' className={navClass}>Playlists</NavLink>
        </nav>
      </header>
      <Outlet></Outlet>
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout></Layout>,
    children: [
      { path: '/', element: <Navigate to='/cards' replace></Navigate> },
      { path: '/cards', element: <CardSearchPage></CardSearchPage> },
      { path: '/decks', element: <DecksPage></DecksPage> },
      { path: '/decks/:id', element: <DeckPage></DeckPage> },
      { path: '/wth', element: <WthListPage></WthListPage> },
      { path: '/wth/new', element: <WthGuidePage></WthGuidePage> },
      { path: '/wth/:id', element: <WthGuidePage></WthGuidePage> },
      { path: '/combos', element: <ComboListPage></ComboListPage> },
      { path: '/combos/new', element: <ComboEditPage></ComboEditPage> },
      { path: '/combos/:id', element: <ComboPage></ComboPage> },
      { path: '/combos/:id/edit', element: <ComboEditPage></ComboEditPage> },
      { path: '/playlists', element: <PlaylistListPage></PlaylistListPage> },
      { path: '/playlists/new', element: <PlaylistEditPage></PlaylistEditPage> },
      { path: '/playlists/:id', element: <PlaylistPage></PlaylistPage> },
      { path: '/playlists/:id/edit', element: <PlaylistEditPage></PlaylistEditPage> },
      { path: '*', element: <p className='p-8'>Page Not Found.</p>}
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router}></RouterProvider>;
}