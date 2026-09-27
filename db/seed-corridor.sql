-- Seed Melun corridor refs (idempotent). Run after db/schema.sql.

INSERT INTO ref_lines (line_id, short_name, display_name, art_tct, corridor_id)
VALUES ('IDFM:C01728', 'D', 'RER D — Branche Melun', 'TBD', 'rer-d-melun')
ON CONFLICT (line_id) DO NOTHING;

INSERT INTO ref_stops (
  stop_id, code_ci, uic8, name, name_display, corridor_id, sequence_order, is_hub, aliases_code_ci
) VALUES
  ('IDFM:monomodalStopPlace:470195', '686030', '87686030', 'Paris-Gare-de-Lyon (Banlieue)', 'Paris Gare de Lyon', 'rer-d-melun', 1, true, ARRAY['686006']),
  ('IDFM:monomodalStopPlace:43154', '681155', '87681155', 'Maisons-Alfort-Alfortville', 'Maisons-Alfort - Alfortville', 'rer-d-melun', 2, false, '{}'),
  ('IDFM:monomodalStopPlace:464040', '681247', '87681247', 'Le Vert-de-Maisons', 'Le Vert de Maisons', 'rer-d-melun', 3, false, '{}'),
  ('IDFM:monomodalStopPlace:46286', '608802', '87608802', 'Créteil-Pompadour', 'Créteil Pompadour', 'rer-d-melun', 4, false, '{}'),
  ('IDFM:monomodalStopPlace:45067', '681825', '87681825', 'Villeneuve-St-Georges', 'Villeneuve-Saint-Georges', 'rer-d-melun', 5, false, '{}'),
  ('IDFM:monomodalStopPlace:46304', '681809', '87681809', 'Villeneuve-St-Georges-Triage', 'Villeneuve Triage', 'rer-d-melun', 6, false, '{}'),
  ('IDFM:monomodalStopPlace:47684', '682104', '87682104', 'Montgeron-Crosne', 'Montgeron - Crosne', 'rer-d-melun', 7, false, '{}'),
  ('IDFM:monomodalStopPlace:43226', '682112', '87682112', 'Yerres', 'Yerres', 'rer-d-melun', 8, false, '{}'),
  ('IDFM:monomodalStopPlace:58873', '682120', '87682120', 'Brunoy', 'Brunoy', 'rer-d-melun', 9, false, '{}'),
  ('IDFM:monomodalStopPlace:47924', '682138', '87682138', 'Boussy-St-Antoine', 'Boussy-Saint-Antoine', 'rer-d-melun', 10, false, '{}'),
  ('IDFM:monomodalStopPlace:45771', '682146', '87682146', 'Combs-la-Ville-Quincy', 'Combs-la-Ville - Quincy', 'rer-d-melun', 11, false, '{}'),
  ('IDFM:monomodalStopPlace:47669', '682153', '87682153', 'Lieusaint-Moissy', 'Lieusaint - Moissy', 'rer-d-melun', 12, false, '{}'),
  ('IDFM:monomodalStopPlace:47665', '682187', '87682187', 'Savigny-le-Temple-Nandy', 'Savigny-le-Temple - Nandy', 'rer-d-melun', 13, false, '{}'),
  ('IDFM:monomodalStopPlace:42516', '682161', '87682161', 'Cesson', 'Cesson', 'rer-d-melun', 14, false, '{}'),
  ('IDFM:monomodalStopPlace:45784', '682179', '87682179', 'Le Mée', 'Le Mée', 'rer-d-melun', 15, false, '{}'),
  ('IDFM:monomodalStopPlace:47909', '682005', '87682005', 'Melun', 'Melun', 'rer-d-melun', 16, true, '{}')
ON CONFLICT (stop_id) DO NOTHING;
