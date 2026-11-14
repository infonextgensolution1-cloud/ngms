# NGMS HostAfrica-native website and operations platform

This is the isolated Next.js application for the NextGen Maintenance Solutions rebuild. It is intended to run as a Node.js application under the HostAfrica DirectAdmin account on:

`nextgen.getmaintenance.co.za`

## Architecture

- Next.js App Router, React and TypeScript.
- HostAfrica DirectAdmin Node.js application runtime (Node.js 22).
- HostAfrica MySQL/MariaDB for business data and staff sessions.
- Persistent media files on the HostAfrica filesystem outside `public_html`.
- Same-origin Next.js route handlers for public enquiries, staff operations, quotations, invoices, payments, media and project publishing.
- First-party staff authentication using secure HttpOnly sessions and scrypt password hashing.

**This application must not use Supabase, Cloudflare services or Vercel as an application host.** The legacy application at the repository root is retained separately while this isolated rebuild is developed.

## Local development

1. Copy `.env.example` and configure a dedicated MySQL/MariaDB database.
2. Set `SESSION_SECRET` to a cryptographically random value of at least 48 characters.
3. Set `NGMS_SETUP_TOKEN` to a separate random value of at least 32 characters.
4. Set `MEDIA_ROOT` to a writable directory outside the public web root.
5. Install and start:

```bash
npm install
npm run db:migrate
npm run dev
```

## HostAfrica DirectAdmin deployment

1. Create a dedicated database and database user for the new subdomain.
2. Create a Node.js application for `nextgen.getmaintenance.co.za`, selecting Node.js 22 where available.
3. Use an application root outside `public_html`; do not expose `MEDIA_ROOT` through the public document root.
4. Set the variables from `.env.example` in the DirectAdmin application environment.
5. Upload the repository's `ngms-rebuild/` application contents to the Node.js application root.
6. Run `npm install`, `npm run db:migrate`, and `npm run build`.
7. Set the DirectAdmin startup file to `server.cjs` and start/restart the application.
8. Issue and verify the TLS certificate for `nextgen.getmaintenance.co.za` before forcing HTTPS.

The database migration is intended for a new, dedicated staging database only. Do not run it against the existing live application database.

## Initial owner setup

After the application and database are running:

1. Open `/setup`.
2. Enter the one-time `NGMS_SETUP_TOKEN` configured on the server.
3. Create the owner name, email and a strong password (minimum 12 characters).
4. Sign in at `/login`.

The first owner setup closes itself after the first administrator has been created. Do not put the setup token into source control or a browser-visible variable.

## Current modules

- Public website and service pages.
- Public quote enquiry form.
- Secure staff login and owner bootstrap.
- Enquiries and customer records.
- Quotations, customer approval links, invoices and payment records.
- Jobs and scheduling.
- Media upload, preview, metadata, replacement, publication and deletion checks.
- Project Manager with before/after image linking and project publication.
- Website content drafts, approval and publication history.
- Operational reporting and audit events.

## Verification

```bash
npm ci
npm run typecheck
npm run build
```

A branch-specific GitHub Actions workflow regenerates the package lockfile when the dependency manifest changes, then runs install, TypeScript and production-build checks.

## Isolation and production boundary

- This application is being developed on `feat/hostafrica-native-ops-rebuild`.
- The intended target is only `nextgen.getmaintenance.co.za`.
- Keep `nextgensolarmaintenance.co.za` and the existing `staging.getmaintenance.co.za` unchanged.
- Do not merge to `main`, change production DNS, migrate customer records, or cut over the live website without the owner's explicit release approval.
