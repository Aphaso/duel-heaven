import { createBrowserRouter, Navigate, NavLink, Outlet, RouterProvider } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { useAuth } from './auth/useAuth';
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
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GoogleSignupPage from './pages/GoogleSignupPage';
import StorePage from './pages/StorePage';
import StoreListingPage from './pages/StoreListingPage';
import PurchasesPage from './pages/PurchasesPage';
import PurchaseSuccessPage from './pages/PurchaseSuccessPage';
import PurchasedPlaylistPage from './pages/PurchasedPlaylistPage';
import PurchasedComboPage from './pages/PurchasedComboPage';
import AccountPaymentsPage from './pages/AccountPaymentsPage';
import { SupportChat } from './SupportChat';

function navClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'font-semibold text-blue-700'
    : 'text-gray-600 hover:text-gray-900';
}

/** Bar on top + point where the page chosen by the router is shown. */
function Layout() {
  const { user, signOut } = useAuth();

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
          <NavLink to='/store' className={navClass}>Store</NavLink>
          <NavLink to='/purchases' className={navClass}>Purchased</NavLink>
          <NavLink to='/account/payments' className={navClass}>Payments</NavLink>
          <div className='ml-auto flex items-center gap-4 text-sm text-gray-600'>
            <span title={user?.displayName ?? undefined}>
              {user?.username ? `@${user.username}` : user?.email}
            </span>
            <button
              type='button'
              onClick={() => void signOut()}
              className='rounded border border-gray-300 px-3 py-1 hover:bg-gray-50'
            >
              Log out
            </button>
          </div>
        </nav>
      </header>
      <Outlet></Outlet>
      <SupportChat></SupportChat>
    </>
  );
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage></LoginPage> },
  { path: '/register', element: <RegisterPage></RegisterPage> },
  { path: '/register/google', element: <GoogleSignupPage></GoogleSignupPage> },
  {
    element: <RequireAuth></RequireAuth>,
    children: [
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
          { path: '/store', element: <StorePage></StorePage> },
          { path: '/store/:id', element: <StoreListingPage></StoreListingPage> },
          { path: '/purchases', element: <PurchasesPage></PurchasesPage> },
          { path: '/purchases/success', element: <PurchaseSuccessPage></PurchaseSuccessPage> },
          { path: '/purchases/:playlistId', element: <PurchasedPlaylistPage></PurchasedPlaylistPage> },
          { path: '/purchases/:playlistId/combos/:comboId', element: <PurchasedComboPage></PurchasedComboPage> },
          { path: '/account/payments', element: <AccountPaymentsPage></AccountPaymentsPage> },
          { path: '*', element: <p className='p-8'>Page Not Found.</p>}
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router}></RouterProvider>;
}