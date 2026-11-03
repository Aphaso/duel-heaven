import { createBrowserRouter, Navigate, NavLink, Outlet, RouterProvider } from 'react-router';
import CardSearchPage from './pages/CardSearchPage';
import DeckPage from './pages/DeckPage';
import DecksPage from './pages/DecksPage';

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
      { path: '*', element: <p className='p-8'>Page Not Found.</p>}
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router}></RouterProvider>;
}