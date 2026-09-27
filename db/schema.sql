-- LineTrust Phase 2 — Neon schema (refs + agg + watermarks + weights)
-- Project: muddy-paper-90279472 · raw ART stays out of Neon

CREATE TABLE IF NOT EXISTS ref_lines (
  line_id TEXT PRIMARY KEY,
  short_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  art_tct TEXT NOT NULL,
  corridor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ref_stops (
  stop_id TEXT PRIMARY KEY,
  code_ci CHAR(6) NOT NULL,
  uic8 CHAR(8),
  name TEXT NOT NULL,
  name_display TEXT NOT NULL,
  corridor_id TEXT NOT NULL,
  sequence_order INT NOT NULL,
  is_hub BOOLEAN NOT NULL DEFAULT false,
  aliases_code_ci TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code_ci)
);

CREATE TABLE IF NOT EXISTS score_weights (
  version TEXT PRIMARY KEY,
  tpr NUMERIC(6, 4) NOT NULL,
  reliability NUMERIC(6, 4) NOT NULL,
  penalty NUMERIC(6, 4) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS etl_watermarks (
  source_id TEXT NOT NULL,
  partition_key TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  loaded_at TIMESTAMPTZ NOT NULL,
  row_count BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('loaded', 'noop', 'failed')),
  PRIMARY KEY (source_id, partition_key)
);

CREATE TABLE IF NOT EXISTS etl_quarantine (
  id BIGSERIAL PRIMARY KEY,
  source_id TEXT NOT NULL,
  partition_key TEXT NOT NULL,
  reason TEXT NOT NULL,
  sample_count INT NOT NULL DEFAULT 1,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monthly partition cells (hash → replace by month_key × source)
CREATE TABLE IF NOT EXISTS agg_pair_window (
  from_code_ci CHAR(6) NOT NULL,
  to_code_ci CHAR(6) NOT NULL,
  day_type TEXT NOT NULL CHECK (day_type IN ('weekday', 'weekend')),
  window_start_minutes INT NOT NULL CHECK (
    window_start_minutes >= 0 AND window_start_minutes < 1440
  ),
  month_key CHAR(7) NOT NULL,
  n INT NOT NULL,
  n_on_time INT NOT NULL,
  n_delay_gt15 INT NOT NULL,
  n_used_est INT NOT NULL DEFAULT 0,
  n_cancelled INT NOT NULL DEFAULT 0,
  tpr NUMERIC(8, 4) NOT NULL,
  tsr NUMERIC(8, 4) NOT NULL,
  penalty NUMERIC(8, 4) NOT NULL,
  score NUMERIC(8, 4) NOT NULL,
  weights_version TEXT NOT NULL REFERENCES score_weights (version),
  computed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (
    from_code_ci,
    to_code_ci,
    day_type,
    window_start_minutes,
    month_key
  )
);

-- 24-month rollup for hot path (pair × sens × day_type × window)
CREATE TABLE IF NOT EXISTS agg_pair_window_rollup (
  from_code_ci CHAR(6) NOT NULL,
  to_code_ci CHAR(6) NOT NULL,
  day_type TEXT NOT NULL CHECK (day_type IN ('weekday', 'weekend')),
  window_start_minutes INT NOT NULL CHECK (
    window_start_minutes >= 0 AND window_start_minutes < 1440
  ),
  n INT NOT NULL,
  n_on_time INT NOT NULL,
  n_delay_gt15 INT NOT NULL,
  n_used_est INT NOT NULL DEFAULT 0,
  n_cancelled INT NOT NULL DEFAULT 0,
  tpr NUMERIC(8, 4) NOT NULL,
  tsr NUMERIC(8, 4) NOT NULL,
  penalty NUMERIC(8, 4) NOT NULL,
  score NUMERIC(8, 4) NOT NULL,
  weights_version TEXT NOT NULL REFERENCES score_weights (version),
  computed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (from_code_ci, to_code_ci, day_type, window_start_minutes)
);

CREATE INDEX IF NOT EXISTS idx_agg_pair_window_lookup
ON agg_pair_window (from_code_ci, to_code_ci, day_type);

CREATE INDEX IF NOT EXISTS idx_agg_rollup_lookup
ON agg_pair_window_rollup (from_code_ci, to_code_ci, day_type);

INSERT INTO score_weights (version, tpr, reliability, penalty, notes)
VALUES ('w0', 0.50, 0.35, 0.15, 'MVP locked weights — intent + docs/03')
ON CONFLICT (version) DO NOTHING;
