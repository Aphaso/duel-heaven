# Duel Heaven

Applicazione Web per giocatori di Yu-Gi-Oh! che riunisce in un unico post Decklist, guide, linee di combo e relativa compravendita.

## 1. Obiettivo e problema risolto

I giocatori di Yu-Gi-Oh! gestiscono il proprio materiale in modo frammentato: le Decklist sulla companion app ufficiale Yu-Gi-Oh! Neuron, le combo in video o in replay di simulatori come DuelingBook, e le varie guide al matchup in documenti a parte, spesso divisi tra immagini e note. Anche la vendita delle guide alle combo è frammentata tra più piattaforme, e spiegare una combo a parole è ambiguo, perché dipende anche dalla posizione esatta delle carte sul campo a ogni passaggio.

Duel Heaven risolve questo problema offrendo:

- **Decklist** divise in Main, Extra e Side Deck, con i dati e le immagini delle carte presi da [YGOPRODeck](https://ygoprodeck.com/api-guide/).
- **Side Pattern**: quali carte scambiare tra Main Deck e Side Deck contro un determinato avversario.
- **Guide WTH?** (*Where To Handtrap?*): dove e quali interruzioni usare contro un certo avversario.
- **Combo step-by-step**: l'utente registra la combo muovendo le carte sul campo, segnalando quali effetti vengono utilizzati e scrivendo tutte le note che ritiene necessarie, e chi la guarda la riproduce uno step alla volta, con la possibilità di saltare allo step che preferisce e di vedere la posizione di ogni carta sul terreno.
- **Playlist di combo** (I *combo spreadsheets*): raccolte ordinabili di combo, che possono essere messe in vendita.
- **Negozio**: gli utenti comprano le Playlist degli altri tramite Stripe, e il venditore incassa direttamente (Stripe Connect, commissione della piattaforma del 10%).
- **Proxy**: dalla Decklist si scelgono carte e copie da stampare e si scarica un PDF già pronto su pagine A4 con carte da 59 × 86 mm.
- **Assistenza**: un chatbot a regole che risponde alle domande più frequenti.
- **Account**: registrazione con email e password oppure accesso tramite Account Google, e cancellazione dell'Account.

## 2. Architettura e stack tecnologico

```
┌──────────────┐   /api (proxy Vite)   ┌──────────────┐        ┌────────────┐
│   Frontend   │ ────────────────────▶ │   Backend    │ ─────▶ │ PostgreSQL │
│ React + Vite │ ◀──────────────────── │    NestJS    │ Prisma └────────────┘
└──────────────┘      JSON / PDF       └──────┬───────┘
                                              │
                         ┌────────────────────┼─────────────────────┐
                         ▼                    ▼                     ▼
                  Stripe (Connect)     YGOPRODeck API       File system
                                                          (immagini carte)
```

Il progetto è un monorepo con due applicazioni indipendenti: `backend/` e `frontend/`.

### Backend

| Scelta | Motivazione |
|---|---|
| **NestJS** (TypeScript) | Struttura a moduli, controller, servizi e provider con dependency injection: la logica di business sta nei servizi e non nei controller. Validazione dichiarativa dei data in ingresso con DTO (`class-validator`). |
| **PostgreSQL + Prisma** | Dati fortemente relazionali (utenti, Deck, combo, playlist, acquisti) con vincoli di integrità e transazioni. Prisma dà uno schema unito, migrazioni versionate e query tipizzate. |
| **JWT in cookie httpOnly** | Il token non è leggibile da JavaScript, quindi un attacco XSS non può sottrarlo. Protezione CSRF con `SameSite=Lax` più un header personalizzato obbligatorio. |
| **Google Identity Services** | Accesso con Google senza gestire una password. |
| **Stripe Checkout + Connect** | I pagamenti non toccano mai i nostri server: il compratore paga su Stripe e il venditore riceve il suo importo, meno la commissione. |
| **`pdf-lib`** | Genera il PDF delle proxy sul server, senza dipendenze native; ogni immagine è incorporata una sola volta anche se la carta compare più volte. |
| **Immagini auto-ospitate** | Le immagini sono scaricate da YGOPRODeck e servite dal nostro server, così non pesiamo sulle loro risorse e le proxy si generano senza richieste esterne. |

### Frontend

| Scelta | Motivazione |
|---|---|
| **React 19 + TypeScript + Vite** | Interfaccia reattiva a componenti; Vite dà avvio rapido e un proxy `/api` verso il backend, così il browser vede una sola origine (niente CORS in sviluppo). |
| **TanStack Query** | Gestione di cache e stato del server, aggiornamenti ottimistici (per esempio nel riordino) e rinnovo automatico dei dati dopo le modifiche. |
| **React Router (data router)** | Navigazione con stato nell'URL: ricerca e pagina del negozio si possono condividere come link. |
| **Tailwind CSS v4** | Stili direttamente nei componenti, senza fogli CSS da mantenere. |
| **dnd-kit** | Trascinamento per riordinare combo, playlist e carte, con supporto a tastiera. |

### Scelte di progetto rilevanti

- **Bozza ed esplicito "Save"**: Decklist, playlist e combo si modificano in una bozza locale, che viene salvata solo su richiesta; un avviso protegge dalle modifiche non salvate.
- **Limitazioni all'Accesso con Google**: un accesso tramite Account Google viene respinto se tale account condivide l'email con un altro account già registrato su Duel Heaven con email + password. È una scelta voluta per inibire un furto dell'account: se non si operasse in questo modo, un malintenzionato entrato in possesso dell'email di un altro utente potrebbe registrarsi normalmente, attendere che quest'ultimo acceda con Google e così ritrovarsi all'interno dell'account del malcapitato.
- **Cancellazione dell'Account**: le playlist già vendute non vengono distrutte. Diventano un **archivio anonimo** (snapshot) che i compratori continunano a poter consultare.
- **Chatbot a regole**: scelta consapevole al posto di un LLM poiché, per quanto più limitante, è gratuito, prevedibile e non invia dati a terzi.

## 3. Installazione e avvio

### Prerequisiti

- Node.js 20 o superiore e npm
- PostgreSQL 15 o superiore (in locale o in Docker)
- Un account [Stripe](https://dashboard.stripe.com) in **modalità sandbox** con Connect attivato, e la [Stripe CLI](https://docs.stripe.com/striple-cli)
- Un client OAuth Google (tipo "Web Application") per l'accesso con Google

### 1. Clonare il repository

```bash
git clone <URL-DEL-REPOSITORY> duel-heaven
cd duel-heaven
```

### 2. Database

Creare un database vuoto, per esempio:

```bash
createdb duel_heaven
```

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env    # Modificare poi il contenuto con i propri dati
```

Poi:

```bash
npx prisma migrate deploy   # Applica le migrazioni al database
npx prisma generate         # Genera il client Prisma in src/generated/prisma
npm run start:dev           # Avvia il backend su http://localhost:3000
```

### 4. Frontend

In un secondo terminale:

```bash
cd frontend
npm install
cp .env.example .env    # Modificare poi il contenuto con i propri dati
```

Poi:

```bash
npm run dev    # Avvia il frontend su http://localhost:5173
```

Il frontend inoltra le richieste `/api/...` al backend (rimuovendo il prefisso `/api`).

### 5. Google

Nella [Google Cloud Console](https://console.cloud.google.com/apis/credentials) creare un *OAuth client ID* di tipo "Web application" e aggiungere `http://localhost:5173` tra le **Authorized JavaScript origins**. Usare lo stesso Client ID nel backend e nel frontend.

### 6. Stripe (sandbox)

1. Nella dashboard, in modalità sandbox, attivare **Connect** e copiare la chiave segreta in `STRIPE_SECRET_KEY`.
2. In un terzo terminale, inoltrare i webhook al backend:
    ```bash
    stripe login
    stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:3000/stripe/webhook
    ```
    Il comando stampa un segreto `whsec_...`: copiarlo in `STRIPE_WEBHOOK_SECRET` e riavviare il backend.
3. Per vendere, un utente deve completare l'onboarding dei pagamenti dalla pagina *Payments* dell'app. In sandbox si usano i dati di prova di Stripe (carta `4242 4242 4242 4242`, qualunque data futura come scadenza e qualunque CVC).

### 7. Immagini delle carte

I dati delle carte arrivano da YGOPRODeck. Le immagini vengono salvate in `backend/storage/card-images/small/<id>.jpg` e servite dal backend. La generazione delle proxy richiede che le immagini delle carte scelte siano già presenti: se mancano, il server risponde con l'elenco dei nomi delle carte non ancora scaricate.

## 4. Limiti noti

**Pagamenti**
- Funziona solo in **sandbox** Stripe; il passaggio alla produzione richiede la verifica dell'account e una revisione dei flussi.
- L'email del venditore viene condivisa con Stripe per creare il suo account collegato.
- Le commissioni fisse di Stripe possono superare il 10% di commissione della piattaforma sulle playlist a prezzo molto basso. È possibile ovviare al problema regolando la percentuale di commissione della piattaforma e il prezzo minimo di vendita di una playlist.
- Se un utente apre due sessioni di pagamento per la stessa playlist e le paga entrambe, il secondo pagamento va rimborsato a mano. Lo stesso vale per i pagamenti in corso quando il venditore cancella l'account o la playlist: il backend registra nel log la dicitura `REFUND NEEDED`.
- Togliere una combo da una playlist già venduta modifica ciò che vedono i compratori.

**Account**
- La cancellazione dell'account elimina anche lo storico degli acquisti fatti dall'utente come compratore.
- La chiusura dell'account Stripe collegato è "best effort": un eventuale errore viene solo registrato nel log.
- Le playlist archiviate in forma anonima non vengono mai eliminate in modo definitivo.

**Sicurezza**
- Cookie httpOnly e CSRF riducono i rischi, ma un attacco XSS potrebbe comunque compiere azioni a nome dell'utente finché la pagina è aperta.

**Playlist**
- Non c'è un tetto al numero di playlist per utente, ma la richiesta di riordino accetta al massimo 1000 elementi.
- Due riordini simultanei dello stesso elenco producono un errore 409.

**Proxy**
- La scelta delle carte da proxare non viene salvata: vive solo nel browser.
- Le immagini "small" (268 × 391 px) stampate a 59 × 86 mm corrispondono a circa **115 dpi**: adatte a proxy da gioco, meno nitide però di una stampa a 300 dpi.

**Assistenza**
- Il chatbot è un sistema di domande frequenti a parole chiave e non un modello linguistico, pertanto risponde solo agli argomenti previsti.

## 5. Dichiarazione sull'uso di strumenti di AI

Si dichiara che per la realizzazione del presente progetto software ci si è avvalsi dell'ausilio dei seguenti strumenti di Intelligenza Artificiale Generativa:

- **Claude**: per la scrittura di codice.
- **Claude Code**: per la creazione e l'applicazione di un Design System per l'UI del software.

L'architettura del software, la logica di business e tutte le feature per il miglioramento della qualità di vita dei giocatori offerte dall'applicazione rimagono interamente frutto dell'elaborazione originale dell'autore.

L'autore dichiara di aver effettuato personalmente la verifica funzionale e di sicurezza del codice generato, **assumendosi la piena e personale responsabilità del progetto presentato**.