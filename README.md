# SopPe Fake

A blue-and-white marketplace using the uploaded project's original stack: HTML,
CSS and browser JavaScript, Node.js/Express, Prisma 6 and MySQL 8. No framework
rewrite, fixed product categories, or automatically imported catalogue data.

## Panels and permissions

| Panel | Access |
| --- | --- |
| `/guest-panel.html` | Public product browsing, searching and filtering; no cart or management actions |
| `/user-panel.html` | Signed-in customers: account summary, products and their own cart |
| `/seller-panel.html` | Approved sellers: create/edit their own shops, create categories, submit/edit products and upload images |
| `/admin-panel.html` | Administrators: create/manage accounts, approve sellers, edit/ban shops and moderate products |

Guests can navigate to sign-in/registration. They cannot change marketplace data.
Page and API permissions are enforced on the server. Seller identity comes from
the authenticated account, never a URL parameter. Blocking an account or suspending
a seller invalidates access on the next request.

Categories are stored in MySQL and fetched from `/api/categories`. A seller adds
them in the seller panel and chooses one when adding a product. New or edited
products return to draft for administrator approval. Only active products from
active shops, approved sellers and active seller accounts appear publicly.

## Local development

Requires Node.js 22+ and MySQL 8 (Docker Compose is optional). Run commands from
the existing checkout; no additional Git worktree is needed.

```sh
# Optional local MySQL, reachable only on loopback port 3307:
docker compose up -d --wait db
cd backend
npm ci
cp .env.example .env
```

Set `DATABASE_URL` in `backend/.env` if you use your own database. Generate a
random JWT key and put it in `JWT_SECRET` (minimum 32 characters):

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
npm run db:generate
npm run db:push
npm start
```

The Express server serves both frontend and API on port 3000. `/api/health`
checks the HTTP server; browse the catalogue to check database connectivity.
Use `npm run dev` for Node's watch mode. Prisma engine downloads require
`binaries.prisma.sh`; keep TLS and checksum verification enabled.

`db:push` is intended for a new local database. Back up existing data and use a
reviewed migration plan for a deployed database. The original SQL under
`database/` is retained as reference and optional test data; setup never imports
it. A new database starts with **no categories or products**.

## First administrator and seller onboarding

There are no default accounts/passwords. Create the first administrator locally
after initializing the database. Supply `ADMIN_EMAIL` and `ADMIN_PASSWORD` through
your shell or deployment's secure environment configuration, then run:

```sh
npm run admin:create
```

The password must be at least 12 characters and at most 72 UTF-8 bytes. The command
does not reset existing accounts. Clear these temporary provisioning variables
afterward. Public registration offers customer and seller roles only.

1. Register a seller through the login page.
2. Sign in as administrator and approve that seller in the seller-management tab.
3. Sign in as seller, create a shop and add categories/products using the forms.
4. Approve draft products from the administrator's products tab.
5. The new categories/products are now available through the public catalogue.

## Validation

The integration suite exercises real HTTP requests and MySQL: guest permissions,
all panel guards, category persistence/filtering, seller ownership, image uploads,
moderation, account/store suspension, registration, and customer cart isolation.
It creates and removes only its own fixtures; it refuses database names that do
not end in `_test`.

Initialize a separate empty test database with the same schema, then run:

```sh
cd backend
DATABASE_URL="$TEST_DATABASE_URL" npm run db:push
TEST_DATABASE_URL="$TEST_DATABASE_URL" npm test
```

Set `TEST_DATABASE_URL` to your dedicated test database URL first. Without it the
suite reports a skip; a skipped suite is not a successful functional check.
Never point it at the deployed catalogue.

## Deployment

Configure a MySQL database, a unique `JWT_SECRET`, `NODE_ENV=production`, and HTTPS.
Production cookies are Secure and HttpOnly. Behind one trusted reverse proxy,
set `TRUST_PROXY=1` and have it set the original protocol header correctly; keep
direct access to the backend restricted to that proxy. Persist `backend/public/products/`
and the database independently of the application process. The example Compose
credentials are for local development only. Prisma must be generated for the
deployment operating system; Windows-generated engines are not included.

The customer panel currently supports the existing cart workflow. Checkout,
payments, order fulfilment, password recovery, and production login throttling
are separate features, not implemented by this change.
