# NGMS Workflow A — website enquiry to accepted quotation to job

**Scope:** HostAfrica-native application in `ngms-rebuild/`.  
**Environment:** isolated staging database on `nextgen.getmaintenance.co.za`.  
**Status:** implemented in source; database/browser acceptance pending.

## Customer journey

1. Customer opens the public Request a Quote page at `/quote`.
2. Customer selects a service, enters name, phone/email, property area, job description and optional preferred date.
3. The browser submits to the same-origin `POST /api/public/enquiries`.
4. The server validates required fields, email, honeypot, submission key and IP rate limit; then writes an enquiry in HostAfrica MySQL and returns an enquiry reference.
5. The customer sees the reference. The form does not automatically send a quotation or customer message; staff review is required.

## Admin journey

6. An authorised NGMS administrator opens Admin → Enquiries.
7. The administrator converts the enquiry to a CRM customer. Existing matching customer contact details are checked before a new CRM record is created.
8. The administrator prepares an itemised quotation using the customer record, work lines, quantities, units, ZAR unit prices, discount, VAT setting and notes.
9. The API saves the quotation as Draft.
10. The administrator selects the originating enquiry for that same CRM customer and shares the quotation. The API verifies the customer/enquiry relationship, stores only the SHA-256 token hash and issues a 30-day one-use customer decision link.
11. Sending the link by email or WhatsApp remains a human-approved action; automatic sending is not assumed to be configured.

## Customer decision and job creation

12. Customer opens `/quote/[token]`. The server returns only the quotation bound to the valid token, including its line items and totals.
13. Customer selects Accept or Decline. The API checks expiry, one-use status and quotation state.
14. On Accept, one job is created from the quotation and customer, the quotation becomes Accepted, the enquiry is converted and the token is consumed.
15. On Decline, the quotation becomes Declined, the enquiry is closed and no job is created.
16. Replayed, expired or otherwise invalid links are rejected.

## Invoice and payment

17. An invoice can only be created from an accepted quotation and copies the accepted line items and totals.
18. Staff record partial or full payments in the invoice payment ledger.
19. The server rejects overpayment and permits the invoice Paid status only when recorded payments cover the full invoice amount.

## Data and controls

- All money is stored as integer ZAR cents.
- Public customer actions are token-scoped; admin operations require a staff session.
- Privileged writes are logged to `audit_logs`.
- The same administrator who requests website publication cannot approve their own request.
- No customer data or business records are imported from Supabase or other legacy stores by this workflow.
