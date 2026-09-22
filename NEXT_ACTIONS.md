# Next action — finish Make and run the owner-only Paysera test

## Live Supabase status (verified 2026-09-21)
- Custom secrets are present: PAYSERA_PROJECT_ID, PAYSERA_SIGN_PASSWORD, PAYSERA_TEST_MODE=1, SITE_URL.
- Secure Paysera database state machine is applied.
- Legacy public order-read policy is removed.
- Existing Make status webhook was preserved and extended with:
  - id
  - customer_email
  - supplier_status/status
  - payment_status
  - paysera_payment_url
  - paysera_test_mode
  - subtotal, shipping, total, items and existing fields
- Trigger-only SECURITY DEFINER helpers are no longer callable by anon/authenticated users.
- paysera-payment and paysera-callback are deployed as version 4 with platform JWT verification disabled intentionally; the payment function performs its own admin-auth check and the callback verifies Paysera's signature.

## Next
1. In Make, make a backup/export of the existing status-email scenario.
2. Import or reproduce make/PAYSERA-status-emails.READY.blueprint.json.
3. Reuse the existing Resend connection.
4. Put the scenario in Run once and send one owner-only TEST Paysera order.
5. Verify only the owner-test route fires for test mode.
6. Complete the Paysera TEST checkout and verify the database ends at payment_status=test_paid with no paid_at and no fulfilment transition.
7. Verify COD and no-stock branches still work.
8. Only then switch PAYSERA_TEST_MODE to 0 and run a NEW owner-controlled low-value real payment.
9. Only after the real payment passes should Paysera be enabled in the public Hostinger build.

- 2026-09-21: Live Paysera guard hotfix applied: trusted server writes now use a transaction-local marker inside service-only RPCs, fixing the owner Ka stok -> awaiting_payment transition while keeping browser-admin payment fields locked.
