# NGMS HostAfrica release acceptance matrix

**Updated:** 14 November 2026  
**Branch:** `feat/hostafrica-native-ops-rebuild`  
**Target:** `nextgen.getmaintenance.co.za`  
**Release state:** NOT DEPLOYED — NOT APPROVED FOR PRODUCTION

Status meanings:
- **Implemented in source:** the code/UI route exists; it is not necessarily connected to a live host.
- **Build verified:** TypeScript and production build passed in GitHub Actions for the commit identified.
- **Pending host setup:** requires DirectAdmin database, Node app, media directory or TLS configuration.
- **Pending acceptance:** requires browser tests with actual staging services.
- **Not implemented:** not currently present in this rebuild.

| Area | Current status | Evidence / release exit criteria |
|---|---|---|
| Preserve live website and existing staging | **Protected** | Work is isolated to `feat/hostafrica-native-ops-rebuild` and `ngms-rebuild/`. Do not merge or alter production aliases without separate owner approval. |
| NGMS Solar Forge public design | **Implemented in source** | Black, graphite, white and orange system, responsive shell and shared navigation. Complete desktop/mobile visual sign-off on the HostAfrica URL. |
| Public service pages and location templates | **Implemented in source** | App Router service, area, body corporate, portfolio, gallery, pricing and information routes. Browser-check all routes and SEO metadata. |
| Public quotation enquiry | **Implemented in source; pending host test** | Same-origin POST route stores enquiry and returns reference. Test form validation, rate limit, idempotency, mobile and persisted CRM record. |
| Staff authentication / owner bootstrap | **Implemented in source; pending DB test** | scrypt hashes, HttpOnly signed sessions, role guard, one-time setup token and login attempt limit. Test initial owner setup, session expiry/revocation and permissions. |
| CRM / enquiries | **Implemented in source; pending DB test** | Enquiry list/create and conversion to customers. Test duplicate matching, persistence and audit. |
| Quotations and customer decision links | **Implemented in source; pending DB test** | Item lines, discounts, VAT field, 30-day one-use token, accept/decline and duplicate prevention. Test replay/expiry, incorrect customer and accepted quote conversion. |
| Invoices and payments | **Implemented in source; pending DB test** | Invoice from accepted quote, partial payment ledger, overpayment prevention and paid-state reconciliation. Verify partial/full payment and concurrent allocation cases. |
| Jobs and scheduling | **Implemented in source; pending DB test** | Jobs, source quote link and schedule records. Verify date/time and job status flows. |
| Suppliers, materials, purchases, expenses | **Implemented in source; pending DB test** | Separate MySQL tables and protected CRUD/status API. Test low-stock threshold and expense reports. |
| Staff, subcontractors and wage records | **Implemented in source; pending DB test** | Staff profile, subcontractor register, wage calculations. Verify access boundaries and calculation examples; this is not a payroll filing/payment service. |
| Recurring maintenance plans | **Implemented in source; pending DB test** | Plans with frequency and next due date; dashboard due count. Visit scheduling/reminder automation requires additional acceptance. |
| Media Manager | **Implemented in source; pending filesystem test** | Multi-file upload, category, WebP optimisation where smaller, alt text/tags, replace, publish, private preview and delete guard. Test file signatures, size limits, backups, restore and public/private access. |
| Projects and Before/After | **Implemented in source; pending browser test** | Project record, before/after attachment, publish/unpublish/archive and public portfolio. Verify draft photos cannot be fetched publicly and published images can. |
| Homepage carousel | **Implemented in source; pending browser test** | Max 12 active slides, editable image/text/CTA/order and front-end rotation. Test 12/13 boundary and image visibility. |
| Website content CMS | **Implemented in source; pending end-to-end test** | Draft, publication request, second-person review and rollback API. Confirm page render bindings before relying on publishing as general page CMS. |
| MySQL and media backups | **Pending host setup** | Configure automated DB plus private media directory backups; rehearse restore. |
| DirectAdmin Node.js app | **Pending host setup** | Create Node 22 app, configure root and env, install dependencies, build and start using `server.cjs`. |
| HTTPS | **Blocked pending DirectAdmin SSL** | Existing certificate mismatch for `da43.host-ww.net`; install and validate certificate for `nextgen.getmaintenance.co.za`. |
| Real-browser staging acceptance | **Pending** | Complete the above tests on the new subdomain before any release review. |

## Mandatory production release gates

- Latest HostAfrica branch CI passes.
- HostAfrica staging website is reachable over valid HTTPS.
- Database and private media directory backups are enabled and restore-tested.
- Staff login and role boundaries pass.
- Enquiry-to-quote-to-acceptance-to-job workflow passes.
- Invoice payment ledger and business reports reconcile.
- Public media is published only with approval; private media remains protected.
- Mobile, keyboard and accessibility checks complete.
- Owner provides explicit approval for the production release and data migration.
