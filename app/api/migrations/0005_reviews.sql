CREATE TABLE review_allowances(user_id TEXT NOT NULL REFERENCES users(id),period TEXT NOT NULL,remaining INTEGER NOT NULL CHECK(remaining>=0),PRIMARY KEY(user_id,period));
CREATE TABLE review_jobs(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),book_id TEXT NOT NULL,period TEXT NOT NULL,words INTEGER NOT NULL CHECK(words>=0),status TEXT NOT NULL,created INTEGER NOT NULL);
CREATE UNIQUE INDEX one_pending_review ON review_jobs(user_id,book_id) WHERE status='reserved';
CREATE TABLE note_actions(user_id TEXT NOT NULL,job_id TEXT NOT NULL,note_id TEXT NOT NULL,action TEXT NOT NULL CHECK(action IN ('open','accepted','rejected','resolved')),PRIMARY KEY(user_id,job_id,note_id));
CREATE TABLE erase_pending(user_id TEXT NOT NULL,book_id TEXT NOT NULL,PRIMARY KEY(user_id,book_id));
