#!/usr/bin/env node
// cms-password.mjs — mint the CMS_PASSWORD_HASH line for a chosen password.
//
//   node scripts/cms-password.mjs "הסיסמה החדשה"
//
// Prints the line to put in .env.local (and, at deploy time, in the host's
// environment). The password itself is never stored anywhere: only this
// scrypt hash, which is what /api/cms/auth/password verifies against.
//
// To change the password: run this again with the new one and replace the line.
// Every session stays valid (sessions are signed by CMS_SESSION_SECRET, not by
// the password), which is the behavior you want when rotating.

import { hashPassword } from "../src/lib/cms/password-core.mjs";

const password = process.argv[2];
if (!password) {
  console.error('usage: node scripts/cms-password.mjs "הסיסמה"');
  process.exit(1);
}

try {
  console.log(`CMS_PASSWORD_HASH=${hashPassword(password)}`);
} catch (err) {
  console.error(String(err.message ?? err));
  process.exit(1);
}
