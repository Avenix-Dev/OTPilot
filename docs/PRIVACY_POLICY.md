# Privacy Policy

**Avenix OTP Autofill**

*Last Updated: January 2026*

## Overview

Avenix OTP Autofill ("the Extension") is committed to protecting your privacy. This policy explains what data we access and how we handle it.

## Summary

- We access Gmail to read verification codes (read-only)
- All processing happens locally on your device
- We do NOT store, transmit, or log your emails
- We do NOT use analytics or tracking
- We do NOT share any data with third parties

## Data We Access

### Gmail Data (Read-Only)

| What | Why | How |
|------|-----|-----|
| Recent emails (last 10 minutes) | To find verification codes | Gmail API with `gmail.readonly` scope |
| Email subject lines | Codes are often in subjects | Temporary, in-memory only |
| Email body content | To extract OTP codes | Temporary, in-memory only |

**Important:** We use the `gmail.readonly` scope, which means we:
- CAN read your emails
- CANNOT send emails
- CANNOT delete emails
- CANNOT modify emails
- CANNOT access drafts

### Local Storage

| What | Why |
|------|-----|
| Authentication state | Remember if you're connected |
| Current OTP code | Display in popup, enable autofill |
| User preferences | Auto-fill toggle setting |

All local storage stays on your device and is cleared when you uninstall the extension.

## Data We Do NOT Collect

- Email contents or metadata
- Browsing history
- Personal information
- Usage analytics
- Crash reports
- Any form of telemetry

## How OTP Extraction Works

1. When you click "Check Now" or periodically (every 30 seconds):
   - We fetch your most recent emails via Gmail API
   - We scan for verification code patterns
   - If found, we store the code temporarily in memory

2. The code is:
   - Displayed in the extension popup
   - Available for autofill on the current page
   - **Never** sent to any external server
   - **Never** stored persistently

3. When you close your browser:
   - The code is cleared from memory
   - No email content is retained

## Third-Party Services

### Google Gmail API

We use Google's Gmail API to access your emails. When you connect your Gmail account:

- You authenticate directly with Google
- Google's OAuth handles your credentials
- We receive a token to read emails (never your password)
- Google's privacy policy applies: https://policies.google.com/privacy

We do NOT have access to your Gmail password.

## Your Controls

### Disconnect Anytime

Click "Disconnect" in the extension popup to:
- Revoke the extension's access to your Gmail
- Clear all stored data
- Stop all email checking

### Revoke Access via Google

Visit https://myaccount.google.com/permissions to:
- See all apps with access to your Google account
- Revoke access for Avenix OTP Autofill
- Review permissions granted

### Uninstall

Uninstalling the extension:
- Removes all local storage
- Clears any cached tokens
- Stops all Gmail API access

## Data Security

- All Gmail API communication uses HTTPS encryption
- OAuth tokens are stored in Chrome's secure storage
- No data leaves your device (except Gmail API requests to Google)
- We follow Chrome extension security best practices

## Open Source Transparency

This extension is open source. You can:
- Review all code: https://github.com/avenix/otp-autofill
- Verify our privacy claims
- Report security issues
- Contribute improvements

## Children's Privacy

This extension is not intended for children under 13. We do not knowingly collect data from children.

## Changes to This Policy

We may update this policy occasionally. Changes will be:
- Reflected in the "Last Updated" date
- Communicated via extension updates for significant changes
- Available in the GitHub repository

## Contact

Questions about this privacy policy?

- **Email:** privacy@avenix.dev
- **Website:** https://avenix.dev
- **GitHub Issues:** https://github.com/avenix/otp-autofill/issues

---

**Avenix**
https://avenix.dev

*Building software that respects your privacy.*
