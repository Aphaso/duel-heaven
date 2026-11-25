export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  // Words or sentences indicating this topic. The weight is increased based on specificity
  keywords: string[];
  // App page concerning the topic (router path)
  link?: { label: string; to: string };
}

export const FAQ: FaqEntry[] = [
  {
    id: 'cards-search',
    question: 'How do I find a card?',
    answer:
      'Open the Cards page and type part of the name in the search box. Card data and images come from YGOPRODeck and are stored on our own server.',
    keywords: ['card', 'search', 'find', 'look up', 'filter', 'image', 'ygoprodeck'],
    link: { label: 'Go to Cards', to: '/cards' },
  },
  {
    id: 'deck-create',
    question: 'How do I build a decklist?',
    answer:
      'Open Decks, create a new deck, then add cards to the Main, Extra and Side sections. Changes are kept as a draft until you press Save.',
    keywords: ['deck', 'decklist', 'build deck', 'create deck', 'main deck', 'extra deck', 'side deck', 'add card'],
    link: { label: 'Go to Decks', to: '/decks' },
  },
  {
    id: 'side-patterns',
    question: 'What are side patterns?',
    answer:
      'A side pattern describes which cards you swap in and out of your deck for a given matchup. Create them from the deck page, in the side patterns tab.',
    keywords: ['side pattern', 'siding', 'side', 'swap', 'matchup', 'sideboard'],
    link: { label: 'Go to Decks', to: '/decks' },
  },
  {
    id: 'wth',
    question: 'What is a WTH guide?',
    answer:
      'A WTH guide explains how to respond when the opponent does something unexpected, for example which card you can play to answer a given play. Create and edit them in the WTH section.',
    keywords: ['wth', 'guide', 'what to heck', 'respond', 'answer play', 'counter'],
    link: { label: 'Go to WTH', to: '/wth' },
  },
  {
    id: 'combo-create',
    question: 'How do I create a combo?',
    answer:
      'Open Combos and create a new one. A combo is a sequence of steps; in each step you move cards on the board (hand, monster zones, spell and trap zones, graveyard…). Use the player to replay it step by step.',
    keywords: ['combo', 'step', 'board', 'zone', 'create combo', 'player', 'replay', 'sequence'],
    link: { label: 'Go to Combos', to: '/combos' },
  },
  {
    id: 'playlist',
    question: 'What is a playlist?',
    answer:
      'A playlist is an ordered collection of your combos. Create one in Playlists, add combos and drag them into the order you want. Save to keep your changes.',
    keywords: ['what is a playlist', 'create playlist', 'new playlist', 'reorder', 'playlist order', 'group combos'],
    link: { label: 'Go to Playlists', to: '/playlists' },
  },
  {
    id: 'sell',
    question: 'How do I sell a playlist?',
    answer:
      'First connect your payments account (Stripe) from the Payments page and finish onboarding. Then edit a playlist, tick "For sale", set a price between €0.50 and €500 and save. Buyers get read-only access.',
    keywords: ['sell', 'selling', 'seller', 'for sale', 'price', 'earn', 'publish playlist', 'list playlist'],
    link: { label: 'Go to Payments', to: '/account/payments' },
  },
  {
    id: 'payments-connect',
    question: 'How do I receive money from my sales?',
    answer:
      'Open the Payments page and press Connect with Stripe. After onboarding, the money from each sale is sent to your Stripe account minus the platform commission. This project runs in test mode, so no real money moves.',
    keywords: ['receive money', 'get paid', 'payout', 'payment account', 'stripe', 'connect', 'onboarding', 'earnings', 'money'],
    link: { label: 'Go to Payments', to: '/account/payments' },
  },
  {
    id: 'fee',
    question: 'How much commission does the platform take?',
    answer:
      'The platform keeps 10% of each sale. Stripe’s own processing fees are paid out of that share, and the rest goes to the seller.',
    keywords: ['fee', 'commission', 'percent', 'cut', 'how much platform', 'charge'],
    link: { label: 'Go to Payments', to: '/account/payments' },
  },
  {
    id: 'buy',
    question: 'How do I buy a playlist?',
    answer:
      'Open the Store, choose a playlist and press Buy. You pay on Stripe’s secure page (in test mode use card 4242 4242 4242 4242 with any future date and any CVC). Afterwards it appears under Purchased.',
    keywords: ['buy', 'purchase', 'pay', 'checkout', 'store', 'test card', '4242', 'card number', 'bought'],
    link: { label: 'Go to Store', to: '/store' },
  },
  {
    id: 'purchased-access',
    question: 'What can I do with a playlist I bought?',
    answer:
      'You can open it and replay its combos step by step, but you cannot edit it. You see the seller’s updates. If the seller deletes the playlist, you keep the last version that existed.',
    keywords: ['purchased', 'bought playlist', 'access', 'read only', 'read-only', 'edit bought', 'seller deletes', 'deleted playlist', 'keep', 'playlist i bought'],
    link: { label: 'Go to Purchased', to: '/purchases' },
  },
  {
    id: 'payment-failed',
    question: 'My payment went through but I do not see the playlist',
    answer:
      'Wait a few seconds and reload the Purchased page: the purchase is confirmed by Stripe a moment after payment. If it still does not appear, contact the project maintainer with the time of the payment.',
    keywords: ['not see', 'missing', 'paid but', 'not appear', 'payment failed', 'charged', 'refund', 'double charge', 'twice'],
    link: { label: 'Go to Purchased', to: '/purchases' },
  },
  {
    id: 'login-google',
    question: 'Can I sign in with Google?',
    answer:
      'Yes. Use the Google button on the login or register page. If you are new, you will be asked to choose a username. An account created with email and password cannot be merged automatically with a Google account that has the same email.',
    keywords: ['google', 'sign in', 'login', 'log in', 'register', 'sign up', 'account', 'oauth'],
    link: { label: 'Go to Login', to: '/login' },
  },
  {
    id: 'logout-session',
    question: 'Why was I logged out?',
    answer:
      'Your session lasts 7 days. After that, or after you press Log out, you need to sign in again. You will land on the main page of the section you were viewing.',
    keywords: ['logged out', 'log out', 'logout', 'session', 'expired', 'sign out'],
  },
  {
    id: 'password',
    question: 'What are the rules for username and password?',
    answer:
      'The username must be 3 to 20 characters and must be available; the password needs at least 8 characters.',
    keywords: ['username', 'password', 'characters', 'requirements', 'rules', 'taken', 'available'],
    link: { label: 'Go to Register', to: '/register' },
  },
  {
    id: 'delete-account',
    question: 'How do I delete my account?',
    answer:
      'Click your @username in the top bar to open your Account page, then use Delete Account at the bottom. Your decks, combos, guides and purchases are erased. Playlists that other people already bought stay available to them, without your name.',
      keywords: ['delete my account', 'delete account', 'remove my account', 'close my account', 'delete my data', 'erase account'],
      link: { label: 'Go to Account', to: '/account' },
  },
];