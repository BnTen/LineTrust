-- LineTrust — Neon schema (multi-lignes / multi-corridors)
-- Project: muddy-paper-90279472 · raw ART stays out of Neon
-- Agg PK includes line_id (human gate S0: 1 score per line)

CREATE TABLE IF NOT EXISTS ref_lines (
  line_id TEXT PRIMARY KEY,
  short_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  art_tct CHAR(3) NOT NULL,
  network TEXT NOT NULL DEFAULT 'rer'
    CHECK (network IN ('rer', 'transilien')),
  coverage TEXT NOT NULL DEFAULT 'full'
    CHECK (coverage IN ('full', 'partial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ref_stops (
  stop_id TEXT PRIMARY KEY,
  code_ci CHAR(6) NOT NULL,
  uic8 CHAR(8),
  name TEXT NOT NULL,
  name_display TEXT NOT NULL,
  aliases_code_ci TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code_ci)
);

CREATE TABLE IF NOT EXISTS ref_corridors (
  corridor_id TEXT PRIMARY KEY,
  line_id TEXT NOT NULL REFERENCES ref_lines (line_id),
  display_name TEXT NOT NULL,
  hub_code_ci CHAR(6),
  end_code_ci CHAR(6),
  coverage TEXT NOT NULL DEFAULT 'full'
    CHECK (coverage IN ('full', 'partial')),
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'seeded', 'loaded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ref_corridor_stops (
  corridor_id TEXT NOT NULL REFERENCES ref_corridors (corridor_id),
  stop_id TEXT NOT NULL REFERENCES ref_stops (stop_id),
  sequence_order INT NOT NULL,
  is_hub BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (corridor_id, stop_id)
);

CREATE INDEX IF NOT EXISTS idx_ref_corridor_stops_stop
ON ref_corridor_stops (stop_id);

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

-- Monthly cells — line_id required (A→B on line X ≠ same OD on line Y)
CREATE TABLE IF NOT EXISTS agg_pair_window (
  line_id TEXT NOT NULL REFERENCES ref_lines (line_id),
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
    line_id,
    from_code_ci,
    to_code_ci,
    day_type,
    window_start_minutes,
    month_key
  )
);

CREATE TABLE IF NOT EXISTS agg_pair_window_rollup (
  line_id TEXT NOT NULL REFERENCES ref_lines (line_id),
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
  PRIMARY KEY (line_id, from_code_ci, to_code_ci, day_type, window_start_minutes)
);

CREATE INDEX IF NOT EXISTS idx_agg_pair_window_lookup
ON agg_pair_window (line_id, from_code_ci, to_code_ci, day_type);

CREATE INDEX IF NOT EXISTS idx_agg_rollup_lookup
ON agg_pair_window_rollup (line_id, from_code_ci, to_code_ci, day_type);

INSERT INTO score_weights (version, tpr, reliability, penalty, notes)
VALUES ('w0', 0.50, 0.35, 0.15, 'MVP locked weights — intent + docs/03')
ON CONFLICT (version) DO NOTHING;
