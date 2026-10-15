-- Restore staff quote editing and remove direct customer status changes.
--
-- The SQL from PR #56 (customer quote approval, never merged) was applied to the
-- live database. It ran:
--   revoke update on public.quotes from authenticated;
--   grant update (status) on public.quotes to authenticated;
-- so every signed-in user, staff included, could only update the "status" column.
-- Admin quote edits always also write updated_at / totals / deposit / VAT, so
-- editing a quote, marking it sent and booking a job from it all failed with
-- "permission denied".
--
-- It also added customer_update_sent_quote, letting a customer flip their quote to
-- accepted/declined directly — which skips the real acceptance flow
-- (app/api/quote/[token]/accept: validity check, version record, lead → won, job and
-- deposit invoice). Customers now accept from the portal via "View & accept", which
-- opens that same quote page, so this policy is removed.
--
-- Row-level security still limits writes: staff_all (private.is_ngms_prompt_user())
-- is the only UPDATE policy left on quotes.

begin;

drop policy if exists customer_update_sent_quote on public.quotes;

grant update on public.quotes to authenticated;

commit;
