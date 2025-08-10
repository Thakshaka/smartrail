-- Fix route stations for Main Line to ensure Kandy-Colombo search works

-- First, clear existing route_stations for Main Line
DELETE FROM route_stations WHERE route_id = (SELECT id FROM routes WHERE name = 'Main Line');

-- Add route stations for Main Line (Colombo to Kandy route)
INSERT INTO route_stations (route_id, station_id, order_index, arrival_time, departure_time)
SELECT 
  (SELECT id FROM routes WHERE name = 'Main Line'),
  s.id,
  data.order_index,
  data.arrival_time::TIME,
  data.departure_time::TIME
FROM (VALUES
  ('CMB', 1, NULL, '06:00:00'),
  ('MDA', 2, '06:05:00', '06:07:00'),
  ('RGM', 3, '06:25:00', '06:27:00'),
  ('GPH', 4, '06:40:00', '06:42:00'),
  ('VYA', 5, '06:55:00', '06:57:00'),
  ('MIG', 6, '07:10:00', '07:12:00'),
  ('PGH', 7, '07:30:00', '07:35:00'),
  ('KUR', 8, '08:00:00', '08:05:00'),
  ('KDY', 9, '09:30:00', NULL)
) AS data(station_code, order_index, arrival_time, departure_time)
JOIN stations s ON s.code = data.station_code;

-- Verify the data
SELECT 
  rs.route_id,
  r.name as route_name,
  s.name as station_name,
  s.code as station_code,
  rs.order_index,
  rs.arrival_time,
  rs.departure_time
FROM route_stations rs
JOIN routes r ON rs.route_id = r.id
JOIN stations s ON rs.station_id = s.id
WHERE r.name = 'Main Line'
ORDER BY rs.order_index;
