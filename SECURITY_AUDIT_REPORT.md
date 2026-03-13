# ChatterBox Security Audit Report

**Overall Security Rating:** 4 / 10

## 1. Broken Access Control on Chat Participants (Privilege Escalation)
* **Severity:** **Critical**
* **File Location:** `supabase/migrations/COMBINED_MIGRATION.sql` (Line ~192)
* **Why it is dangerous:** The RLS policy for inserting into `chat_participants` contains an exploitable logic flaw: `WITH CHECK (auth.uid() = user_id OR public.is_chat_participant(chat_id, auth.uid()))`. Because of the `OR` operator, any authenticated user can insert a record where their own ID is the `user_id`, for *any* `chat_id` in the database.
* **Example Attack Scenario:** An attacker lists or guesses a `chat_id` (UUID), then executes `supabase.from('chat_participants').insert({ chat_id: 'target-uuid', user_id: attacker_uid })`. They immediately gain full read/write access to that private chat.
* **Recommended Fix:** Add a `created_by` field to the `chats` table. Update the policy so a user can only add themselves if they created the chat, and otherwise can only add others if they are already a participant.

## 2. Insecure Direct Object Reference (IDOR) on Updates
* **Severity:** **Critical**
* **File Location:** `supabase/migrations/COMBINED_MIGRATION.sql` (Lines 252, 200, 167)
* **Why it is dangerous:** The `UPDATE` policies on major tables (like `messages`, `chat_participants`, `friends`, `chats`) do not restrict which columns can be modified. A user authorized to update a row can modify vital foreign keys such as `chat_id` or `sender_id`.
* **Example Attack Scenario:** A user sends a message in their own chat. They then update that message, changing `chat_id` to a target private chat. The message now appears in the victim's private chat, bypassing the `INSERT` protections.
* **Recommended Fix:** Implement PostgreSQL triggers to strictly prevent modifications to primary keys and relational foreign keys (`chat_id`, `sender_id`, `user_id`, etc.) across all core tables.

## 3. Insecure Storage Buckets (Public Media Exposure)
* **Severity:** **High**
* **File Location:** `supabase/migrations/COMBINED_MIGRATION.sql` (Lines ~488)
* **Why it is dangerous:** The `chat-images` and `chat-media` Supabase storage buckets are configured as `public=true`. Any individual possessing the URL can seamlessly view or download private chat attachments without any authentication checks.
* **Example Attack Scenario:** A user's private media URL is accidentally shared, cached by a CDN, or scraped. Anyone on the internet can continually access those files.
* **Recommended Fix:** Configure buckets as private (`public=false`) and utilize Supabase Signed URLs with short expirations for media retrieval.

## 4. Suboptimal Session Storage (XSS Vulnerability Surface)
* **Severity:** **Medium**
* **File Location:** `src/integrations/supabase/client.ts`
* **Why it is dangerous:** Supabase Authentication is explicitly configured to persist sessions via frontend `localStorage`. If an XSS vulnerability exists anywhere in dependencies or code, scripts can exfiltrate full, long-lived JWTs.
* **Example Attack Scenario:** An attacker injects malicious JavaScript via an unescaped markdown parser or 3rd-party ad script. The script reads `localStorage` and transmits the `sb-***-auth-token` to an external server.
* **Recommended Fix:** Currently relying on React's auto-escaping. Ensure comprehensive Content Security Policy (CSP) headers are active. For deepest security, migrate auth to an httpOnly cookie server-side approach in the future.

## 5. Missing Application-Level Rate Limiting on Messaging
* **Severity:** **Medium**
* **File Location:** `src/hooks/useChats.ts`
* **Why it is dangerous:** Users can execute API calls unabated. While Supabase handles authentication abuse natively, aggressive API usage on the `messages` endpoint can result in Database CPU exhaustion or spam.
* **Example Attack Scenario:** A malicious user creates a loop executing `chatService.sendMessage()` 500 times per second to spam a group chat and burden the realtime pipeline.
* **Recommended Fix:** Implement the provided `createRateLimiter` utility to enforce a message-send limit (e.g., 5 msgs / 3 secs) globally on frontend hooks and backend Database triggers.
