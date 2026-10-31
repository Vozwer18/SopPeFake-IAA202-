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

Sellers can manage multiple SKUs per product using **+ Thêm SKU** in the product
form, with separate prices and stock. Existing SKUs can be retired/reactivated
without breaking cart/order references. See [the multi-SKU guide](MULTI_SKU.md).
This uses the current database schema and requires no new migration.

The catalogue searches both product and shop names, with newest products first.
Product details and cart quantities use the selected variant's available stock
(quantity minus reserved quantity), excluding inactive variants. Cart images fall
back to product media, and unavailable items are marked in the cart. Administrators
can preview draft descriptions, images, categories and variants before approval.

The interface supports narrow mobile screens, scrollable management tables,
keyboard-contained dialogs, image fallbacks and retry controls for failed lists.
The seller shop form's **Tạo mới** action clears the edited shop ID before creating
another shop.

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

`database/index.sql` is an optional exception: it adds missing indexes and default
system configuration entries to an already initialized database. It can be rerun
after Prisma setup without duplicate-index errors or overwriting existing config
values. Select the intended database in your MySQL client; the script no longer
switches databases or disables foreign-key checks:

```sh
# From the project root; replace the two placeholders with your local settings.
mysql -u YOUR_USER -p YOUR_DATABASE < database/index.sql
```

No schema migration is required for the interface/catalogue fixes. The legacy
demo seed files remain optional reference data. Their plaintext sample passwords
are not compatible with the bcrypt login flow; use registration or `admin:create`
to provision usable accounts.

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
It also covers shop-name search, newest-first sorting, protected draft previews,
variant-level reserved stock and cart media/availability.
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

For a free class-project demo, use [Render Free + Aiven MySQL](DEPLOY_FREE.md).
`render.yaml` selects the Free instance and database-backed image uploads, so
uploads survive container restarts without a paid disk. `npm run start:demo`
runs migrations before listening and optionally provisions the first admin.
Local development continues to use filesystem uploads by default.

For a first online deployment, follow [the Railway walkthrough in Vietnamese](DEPLOY_RAILWAY.md).
The root `Dockerfile` packages the existing Express frontend/API together;
`railway.json` runs versioned database migrations before starting the application.

Configure a MySQL database, a unique `JWT_SECRET`, `NODE_ENV=production`, and HTTPS.
Production cookies are Secure and HttpOnly. Behind one trusted reverse proxy,
set `TRUST_PROXY=1` and have it set the original protocol header correctly; keep
direct access to the backend restricted to that proxy. Persist `backend/public/products/`
and the database independently of the application process. The example Compose
credentials are for local development only. Prisma must be generated for the
deployment operating system; Windows-generated engines are not included.

The cart supports checkout into separate shop orders and manual QR transfers.
Sellers upload a shop QR, confirm received payment, then mark goods shipped;
buyers confirm receipt to unlock one review per product/order. See the
[QR order guide](QR_ORDERS.md). Checkout reserves stock and repeat submissions
do not duplicate orders. The new additive migration stores QR snapshots and
checkout tokens; startup applies it without resetting data.

Bank transaction verification, payment-provider webhooks, automatic refunds,
shipping tracking, password recovery and production login throttling are not
implemented. QR transfers and seller payment confirmations are manual.

## Opening HTML files and returning to the storefront

Download/clone the **whole repository** and keep the `frontend/css` and
`frontend/js` folders beside the HTML pages. Do not copy only the HTML files to
`C:\`. Relative asset/page links now work when previewing files directly. The
navbar is embedded in each storefront page so previewing does not require a
`file://` fetch. A notice explains that live data and mutations require Express.

For normal use, configure the backend as above, run `npm start` from `backend`,
and open **http://localhost:3000** (not `file:///...` or Live Server).
Admin and seller logos now open `index.html`, which serves the storefront for
all roles. The account link returns to the appropriate panel. Protected panel
routes and API role checks are unchanged; browsing does not grant cart access.
