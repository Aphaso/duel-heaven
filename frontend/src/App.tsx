import { createBrowserRouter, Link, Navigate, RouterProvider } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
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
import AccountPage from './pages/AccountPage';
import { AppShell } from './layout/AppShell';
import { buttonStyles } from './ui/styles';
import { EmptyState } from './ui/States';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage></LoginPage> },
  { path: '/register', element: <RegisterPage></RegisterPage> },
  { path: '/register/google', element: <GoogleSignupPage></GoogleSignupPage> },
  {
    element: <RequireAuth></RequireAuth>,
    children: [
      {
        element: <AppShell></AppShell>,
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
          { path: '/account', element: <AccountPage></AccountPage> },
          { path: '/account/payments', element: <AccountPaymentsPage></AccountPaymentsPage> },
          {
            path: '*',
            element: (
              <main className='mx-auto max-w-page px-gutter py-16 lg:px-gutter-lg'>
                <EmptyState
                  title='Page Not Found.'
                  description='This page does not exist or has been moved.'
                  action={<Link to='/cards' className={buttonStyles({ variant: 'primary' })}>Back to Cards</Link>}
                ></EmptyState>
              </main>
            ),
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router}></RouterProvider>;
}