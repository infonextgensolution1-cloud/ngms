# NGMS HostAfrica-native rebuild — execution plan

**Working branch:** `feat/hostafrica-native-ops-rebuild`  
**Target staging host:** `nextgen.getmaintenance.co.za`  
**Application source:** `ngms-rebuild/`  
**Status:** isolated planning/build branch; NOT deployed.

## Non-negotiable hosting and service constraints

- HostAfrica DirectAdmin is the application host.
- Do not use Supabase.
- Do not use Cloudflare (Workers, D1, R2, Access, Turnstile or CDN) as an application dependency.
- Do not use Vercel as the production or staging runtime.
- Keep `nextgensolarmaintenance.co.za`, `staging.getmaintenance.co.za`, and the current root application unchanged.
- Work only on `nextgen.getmaintenance.co.za` and this branch until the owner approves a production cutover.
- Do not migrate, delete or overwrite source customer/media/financial data before a verified export and explicit migration approval.

## Account facts verified on 14 November 2026

- HostAfrica lists `getmaintenance.co.za` as Active and attached to DirectAdmin hosting service.
- The parent zone uses HostAfrica nameservers `dan1.host-ww.net` and `dan2.host-ww.net`.
- The `nextgen` A record exists and points to `102.68.97.179`.
- The existing `staging` A record also points to `102.68.97.179`.
- `http://nextgen.getmaintenance.co.za` returned HTTP 200.
- HTTPS currently presents a Let's Encrypt certificate for `da43.host-ww.net`, not `nextgen.getmaintenance.co.za`. HTTPS validation fails. Do not force an HTTPS redirect until the correct certificate is installed and validated.
- The connected HostAfrica API integration can inspect domains, DNS and VPS services and can manage certain DNS/VPS operations. It does not expose the DirectAdmin application manager, SSH shell, File Manager, database creation or per-domain SSL controls. No hosting files, application settings, database or SSL configuration have been changed by this work.

## Target deployment architecture

### Application runtime

Use the existing Next.js App Router / React / TypeScript rebuild in `ngms-rebuild/`, running as a Node.js application in DirectAdmin. Confirm the Node.js selector is available in this specific hosting account before deployment; select Node.js 22 LTS where offered.

Use an application root outside `public_html`, for example:

```text
/home/<hosting-user>/domains/nextgen.getmaintenance.co.za/app
```

The app must listen on the port supplied by DirectAdmin via `process.env.PORT`. Do not hard-code a port. Use the DirectAdmin startup and restart controls after dependency installation or release changes.

### Database

Use a dedicated MySQL/MariaDB database created in DirectAdmin for this staging application. Keep all credentials in DirectAdmin environment variables or a server-side environment file outside the public document root. Use parameterised queries, schema migrations, indexes, transaction boundaries and automated backups.

Suggested core tables: staff users and sessions, customers, enquiries, services, quotations and line items, invoices and payments, jobs and schedules, projects, media records, website content, suppliers, materials, expenses, maintenance plans, documents, notifications and audit logs.

### Media storage

Use persistent HostAfrica filesystem storage outside `public_html`, for example:

```text
/home/<hosting-user>/private/ngms-media
```

Store metadata in MySQL/MariaDB. Store file bytes on disk. Serve media through application routes with access checks:
- Published web images may be read publicly using opaque media identifiers.
- Draft, private job, customer and financial documents require staff/customer authorisation.
- Never expose absolute filesystem paths or directory listings.
- Validate file signatures, MIME type, size and image dimensions.
- Optimise images to WebP where appropriate; retain an original where required.
- On replace/delete, check references and preserve rollback/recovery options.
- Include media and database in separate, tested backup procedures.

### Identity and API

Implement first-party application authentication and server-side authorisation. Use secure HttpOnly cookies, password hashing, expiry/revocation, CSRF/origin checks, rate limits and role-based access. Public enquiry submission must not grant admin access. All admin API handlers must validate the session and role on the server.

Do not expose SQL credentials, password hashes, SMTP credentials or other secrets in client JavaScript. Use HostAfrica mail/SMTP or another explicitly approved transactional email service.

## Existing application work to adapt

The `ngms-rebuild/` directory is an isolated Next.js scaffold with the public-site UI and admin module shell. It is not yet a complete HostAfrica application:
- Its current environment and frontend API client still point to Cloudflare Workers.
- Public quote intake currently points to a Cloudflare Worker and Turnstile.
- Admin collection, content and media calls depend on the Cloudflare API contract.
- The current admin interface presents preview/pending states; those are not functioning business operations until the native backend exists.
- The root application outside `ngms-rebuild/` contains legacy Supabase and Cloudflare implementations. Do not copy those runtime dependencies into the new staging application.

## Implementation order and release gates

1. Inventory all routes, forms, media slots, admin actions and external dependencies in `ngms-rebuild/`.
2. Replace Cloudflare API/Turnstile references with same-origin Next.js route handlers.
3. Add MySQL/MariaDB schema and migrations, connection management, authentication and admin-user provisioning.
4. Implement public enquiry intake and staff lead management.
5. Implement media upload/list/metadata/replace/delete/publish with file storage outside `public_html`.
6. Connect the current frontend media placements, hero slides (maximum 12), gallery and before/after projects to the new media library.
7. Implement customer, quotations, invoices, jobs, schedules, suppliers, inventory, financial reporting and content management incrementally, with server-side permissions and audit records.
8. Add SMTP notifications and controlled AI draft assistance only after core workflows are reliable.
9. Run type checks, production build, API tests, file-upload tests, permissions tests, mobile QA and enquiry-to-job workflow tests.
10. Deploy to the new subdomain, install the correct SSL certificate, verify HTTPS, then perform owner acceptance testing.

## Deployment blocker / access required

The HostAfrica API connection currently available in this workspace cannot create the Node.js app, upload application files, create a MySQL/MariaDB database, set application environment variables, or install the subdomain's SSL certificate in DirectAdmin. Those actions require DirectAdmin UI access or an enabled SSH/SFTP route with a deployment credential. Do not ask the owner to share a DirectAdmin password, SSH private key or application secrets in chat. Use a dedicated, revocable deployment account/key through an approved secure channel.

No production deployment or existing staging changes are authorised by this plan.
