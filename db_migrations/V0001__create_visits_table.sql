CREATE TABLE visits (
  id SERIAL PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  visited_at TIMESTAMP DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

CREATE UNIQUE INDEX visits_ip_date_idx ON visits (ip_hash, date);
