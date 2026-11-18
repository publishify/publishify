-- Google sign-in: one Google account (its stable "sub") belongs to at most one Publishify user.
CREATE TABLE google_accounts (
  sub TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  created INTEGER NOT NULL
);
CREATE INDEX google_accounts_user ON google_accounts(user_id);
