-- Seed RER lines + Melun corridor (idempotent). Run after schema / migration 001.

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

INSERT INTO ref_corridors (
  corridor_id, line_id, display_name, hub_code_ci, end_code_ci, coverage, status
) VALUES (
  'rer-d-melun', 'IDFM:C01728', 'RER D — Branche Melun',
  '686030', '682005', 'full', 'loaded'
)
ON CONFLICT (corridor_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  status = 'loaded';

INSERT INTO ref_stops (
  stop_id, code_ci, uic8, name, name_display, aliases_code_ci
) VALUES
  ('IDFM:monomodalStopPlace:470195', '686030', '87686030', 'Paris-Gare-de-Lyon (Banlieue)', 'Paris Gare de Lyon', ARRAY['686006']),
  ('IDFM:monomodalStopPlace:43154', '681155', '87681155', 'Maisons-Alfort-Alfortville', 'Maisons-Alfort - Alfortville', '{}'),
  ('IDFM:monomodalStopPlace:464040', '681247', '87681247', 'Le Vert-de-Maisons', 'Le Vert de Maisons', '{}'),
  ('IDFM:monomodalStopPlace:46286', '608802', '87608802', 'Créteil-Pompadour', 'Créteil Pompadour', '{}'),
  ('IDFM:monomodalStopPlace:45067', '681825', '87681825', 'Villeneuve-St-Georges', 'Villeneuve-Saint-Georges', '{}'),
  ('IDFM:monomodalStopPlace:46304', '681809', '87681809', 'Villeneuve-St-Georges-Triage', 'Villeneuve Triage', '{}'),
  ('IDFM:monomodalStopPlace:47684', '682104', '87682104', 'Montgeron-Crosne', 'Montgeron - Crosne', '{}'),
  ('IDFM:monomodalStopPlace:43226', '682112', '87682112', 'Yerres', 'Yerres', '{}'),
  ('IDFM:monomodalStopPlace:58873', '682120', '87682120', 'Brunoy', 'Brunoy', '{}'),
  ('IDFM:monomodalStopPlace:47924', '682138', '87682138', 'Boussy-St-Antoine', 'Boussy-Saint-Antoine', '{}'),
  ('IDFM:monomodalStopPlace:45771', '682146', '87682146', 'Combs-la-Ville-Quincy', 'Combs-la-Ville - Quincy', '{}'),
  ('IDFM:monomodalStopPlace:47669', '682153', '87682153', 'Lieusaint-Moissy', 'Lieusaint - Moissy', '{}'),
  ('IDFM:monomodalStopPlace:47665', '682187', '87682187', 'Savigny-le-Temple-Nandy', 'Savigny-le-Temple - Nandy', '{}'),
  ('IDFM:monomodalStopPlace:42516', '682161', '87682161', 'Cesson', 'Cesson', '{}'),
  ('IDFM:monomodalStopPlace:45784', '682179', '87682179', 'Le Mée', 'Le Mée', '{}'),
  ('IDFM:monomodalStopPlace:47909', '682005', '87682005', 'Melun', 'Melun', '{}')
ON CONFLICT (stop_id) DO NOTHING;

INSERT INTO ref_corridor_stops (corridor_id, stop_id, sequence_order, is_hub) VALUES
  ('rer-d-melun', 'IDFM:monomodalStopPlace:470195', 1, true),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:43154', 2, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:464040', 3, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:46286', 4, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:45067', 5, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:46304', 6, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:47684', 7, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:43226', 8, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:58873', 9, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:47924', 10, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:45771', 11, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:47669', 12, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:47665', 13, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:42516', 14, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:45784', 15, false),
  ('rer-d-melun', 'IDFM:monomodalStopPlace:47909', 16, true)
ON CONFLICT (corridor_id, stop_id) DO NOTHING;

-- Proposed corridor shells (no stops yet — filled in S2 ETL seed)
INSERT INTO ref_corridors (corridor_id, line_id, display_name, hub_code_ci, end_code_ci, coverage, status)
VALUES
  ('rer-d-corbeil', 'IDFM:C01728', 'RER D — Branche Corbeil', '686030', NULL, 'full', 'proposed'),
  ('rer-d-malesherbes', 'IDFM:C01728', 'RER D — Branche Malesherbes', NULL, NULL, 'full', 'proposed'),
  ('rer-d-nord', 'IDFM:C01728', 'RER D — Branche Nord', '686030', NULL, 'full', 'proposed'),
  ('rer-e-chelles', 'IDFM:C01729', 'RER E — Branche Chelles', NULL, NULL, 'full', 'proposed'),
  ('rer-e-tournan', 'IDFM:C01729', 'RER E — Branche Tournan', NULL, NULL, 'full', 'proposed'),
  ('rer-e-ouest', 'IDFM:C01729', 'RER E — Branche Ouest', NULL, NULL, 'full', 'proposed'),
  ('rer-c-versailles-rg', 'IDFM:C01727', 'RER C — Versailles Rive Gauche', NULL, NULL, 'full', 'proposed'),
  ('rer-c-versailles-chantiers', 'IDFM:C01727', 'RER C — Versailles Chantiers', NULL, NULL, 'full', 'proposed'),
  ('rer-c-massy', 'IDFM:C01727', 'RER C — Massy', NULL, NULL, 'full', 'proposed'),
  ('rer-c-dourdan', 'IDFM:C01727', 'RER C — Dourdan', NULL, NULL, 'full', 'proposed'),
  ('rer-c-etampes', 'IDFM:C01727', 'RER C — Étampes', NULL, NULL, 'full', 'proposed'),
  ('rer-c-pontoise', 'IDFM:C01727', 'RER C — Pontoise', NULL, NULL, 'full', 'proposed'),
  ('rer-a-poissy', 'IDFM:C01742', 'RER A — Poissy (ouest ART)', NULL, NULL, 'partial', 'proposed'),
  ('rer-a-cergy', 'IDFM:C01742', 'RER A — Cergy (ouest ART)', NULL, NULL, 'partial', 'proposed'),
  ('rer-b-mitry', 'IDFM:C01743', 'RER B — Mitry (nord ART)', NULL, NULL, 'partial', 'proposed'),
  ('rer-b-cdg', 'IDFM:C01743', 'RER B — CDG (nord ART)', NULL, NULL, 'partial', 'proposed')
ON CONFLICT (corridor_id) DO NOTHING;
