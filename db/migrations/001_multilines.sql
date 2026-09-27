-- Migration 001 — multi-lignes / line_id in agg PK / corridors
-- Safe: preserves Melun agg rows (backfill line_id = IDFM:C01728)
-- Project: muddy-paper-90279472

-- 1. Lines catalog (drop legacy corridor_id column after copy)
ALTER TABLE ref_lines
  ADD COLUMN IF NOT EXISTS network TEXT,
  ADD COLUMN IF NOT EXISTS coverage TEXT;

UPDATE ref_lines
SET
  network = COALESCE(network, 'rer'),
  coverage = COALESCE(coverage, 'full'),
  display_name = CASE
    WHEN line_id = 'IDFM:C01728' THEN 'RER D'
    ELSE display_name
  END
WHERE true;

ALTER TABLE ref_lines
  ALTER COLUMN network SET DEFAULT 'rer',
  ALTER COLUMN coverage SET DEFAULT 'full';

UPDATE ref_lines SET network = 'rer' WHERE network IS NULL;
UPDATE ref_lines SET coverage = 'full' WHERE coverage IS NULL;

ALTER TABLE ref_lines ALTER COLUMN network SET NOT NULL;
ALTER TABLE ref_lines ALTER COLUMN coverage SET NOT NULL;

-- Drop corridor_id from ref_lines if present (moved to ref_corridors)
ALTER TABLE ref_lines DROP COLUMN IF EXISTS corridor_id;

INSERT INTO ref_lines (line_id, short_name, display_name, art_tct, network, coverage)
VALUES
  ('IDFM:C01742', 'A', 'RER A', 'TBA', 'rer', 'partial'),
  ('IDFM:C01743', 'B', 'RER B', 'TBB', 'rer', 'partial'),
  ('IDFM:C01727', 'C', 'RER C', 'TBC', 'rer', 'full'),
  ('IDFM:C01728', 'D', 'RER D', 'TBD', 'rer', 'full'),
  ('IDFM:C01729', 'E', 'RER E', 'TBE', 'rer', 'full')
ON CONFLICT (line_id) DO UPDATE SET
  short_name = EXCLUDED.short_name,
  display_name = EXCLUDED.display_name,
  art_tct = EXCLUDED.art_tct,
  network = EXCLUDED.network,
  coverage = EXCLUDED.coverage;

-- 2. Corridors + junction
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

INSERT INTO ref_corridors (
  corridor_id, line_id, display_name, hub_code_ci, end_code_ci, coverage, status
) VALUES (
  'rer-d-melun', 'IDFM:C01728', 'RER D — Branche Melun',
  '686030', '682005', 'full', 'loaded'
)
ON CONFLICT (corridor_id) DO UPDATE SET status = 'loaded';

-- Migrate Melun stops into junction (legacy columns still on ref_stops temporarily)
INSERT INTO ref_corridor_stops (corridor_id, stop_id, sequence_order, is_hub)
SELECT 'rer-d-melun', stop_id, sequence_order, is_hub
FROM ref_stops
WHERE corridor_id = 'rer-d-melun'
ON CONFLICT DO NOTHING;

-- Drop legacy per-stop corridor columns after junction backfill
ALTER TABLE ref_stops DROP COLUMN IF EXISTS corridor_id;
ALTER TABLE ref_stops DROP COLUMN IF EXISTS sequence_order;
ALTER TABLE ref_stops DROP COLUMN IF EXISTS is_hub;

-- 3. agg_pair_window: add line_id + new PK
ALTER TABLE agg_pair_window ADD COLUMN IF NOT EXISTS line_id TEXT;

UPDATE agg_pair_window
SET line_id = 'IDFM:C01728'
WHERE line_id IS NULL;

ALTER TABLE agg_pair_window ALTER COLUMN line_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agg_pair_window_line_id_fkey'
  ) THEN
    ALTER TABLE agg_pair_window
      ADD CONSTRAINT agg_pair_window_line_id_fkey
      FOREIGN KEY (line_id) REFERENCES ref_lines (line_id);
  END IF;
END $$;

ALTER TABLE agg_pair_window DROP CONSTRAINT IF EXISTS agg_pair_window_pkey;
ALTER TABLE agg_pair_window
  ADD PRIMARY KEY (
    line_id, from_code_ci, to_code_ci, day_type, window_start_minutes, month_key
  );

DROP INDEX IF EXISTS idx_agg_pair_window_lookup;
CREATE INDEX idx_agg_pair_window_lookup
ON agg_pair_window (line_id, from_code_ci, to_code_ci, day_type);

-- 4. rollup
ALTER TABLE agg_pair_window_rollup ADD COLUMN IF NOT EXISTS line_id TEXT;

UPDATE agg_pair_window_rollup
SET line_id = 'IDFM:C01728'
WHERE line_id IS NULL;

ALTER TABLE agg_pair_window_rollup ALTER COLUMN line_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agg_pair_window_rollup_line_id_fkey'
  ) THEN
    ALTER TABLE agg_pair_window_rollup
      ADD CONSTRAINT agg_pair_window_rollup_line_id_fkey
      FOREIGN KEY (line_id) REFERENCES ref_lines (line_id);
  END IF;
END $$;

ALTER TABLE agg_pair_window_rollup DROP CONSTRAINT IF EXISTS agg_pair_window_rollup_pkey;
ALTER TABLE agg_pair_window_rollup
  ADD PRIMARY KEY (line_id, from_code_ci, to_code_ci, day_type, window_start_minutes);

DROP INDEX IF EXISTS idx_agg_rollup_lookup;
CREATE INDEX idx_agg_rollup_lookup
ON agg_pair_window_rollup (line_id, from_code_ci, to_code_ci, day_type);
