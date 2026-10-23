CREATE TABLE IF NOT EXISTS scores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    score_x2 INTEGER NOT NULL CHECK (score_x2 >= 0),
    tomato_count INTEGER NOT NULL CHECK (tomato_count >= 0),
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS scores_ranking ON scores (score_x2 DESC, created_at ASC);
