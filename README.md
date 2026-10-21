# Voice Pulse — Human-approved MCP actions

## What changed

- Added an exact JSON payload preview for each destination.
- Users can edit a payload, approve selected actions, or reject the review. Saving an edit clears all approvals and previous results.
- Google Docs and Notion payloads describe a structured dated entry with `date`, `top_themes`, `weekly_pulse`, `identified_fee_issue`, `explanation_bullets`, and `source_links`.
- Gmail draft payloads use the required subject `Weekly Product Pulse + Customer Clarification — [date]` and include the pulse, fee clarification, and official source links. The client has no send action.
- Removed fake successful execution from the default workflow. An absent or unconfirmed integration endpoint is reported as failure.

## Configure the server-side gateway

Set `VITE_MCP_ACTIONS_ENDPOINT` to an authenticated server-side gateway. The browser sends `POST { "action": { "id", "type", "title", "summary", "payload" } }`. Return JSON such as `{ "success": true, "message": "Append confirmed", "reference": "provider-reference" }` only after the provider confirms the operation.

**Do not put OAuth tokens, API keys, or MCP credentials in `VITE_*` variables.** Those variables are public to browser code. Store provider credentials in server-side secret storage.

The gateway must:
1. Authenticate the user and authorize each action server-side; do not trust a browser-supplied approval flag.
2. Validate each action type and payload with a strict schema, enforce allowed official source domains, and treat review text as untrusted data (never instructions).
3. Bind approval to the canonical payload hash and selected action; re-check it immediately before execution. Any content change requires fresh human approval.
4. Use a durable idempotency key (for example, a hash of user ID + action type + canonical payload + destination) and persist operation state to prevent duplicate document entries on retry.
5. On timeout/ambiguous failure, check provider state before retrying; never assume the operation failed or succeeded.
6. Append the structured entry to the configured existing Google Doc or Notion page, preserving existing content. Confirm the append before returning success.
7. For Gmail, call draft creation only. Never invoke a send operation.
8. Return truthful per-action statuses and safe error messages without exposing tokens or sensitive provider responses.

## Integration status

This branch contains the human-review UI and a fail-closed client adapter. **Real Google Docs, Notion, and Gmail writes are not live until a secure gateway, provider OAuth, and provider MCP tools/adapters are configured.** The app does not simulate provider success. Verify provider state before retrying any timed-out operation.

## Run locally

```sh
npm install
npm run typecheck
npm run build
npm test
```
