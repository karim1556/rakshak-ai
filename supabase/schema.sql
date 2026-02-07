-- Rakshak AI Database Schema for Supabase
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('medical', 'fire', 'safety', 'accident', 'other')),
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  victims INTEGER DEFAULT 1,
  risks TEXT[] DEFAULT '{}',
  steps TEXT[] DEFAULT '{}',
  tactical_advice TEXT DEFAULT '',
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'assigned', 'en_route', 'on_scene', 'resolved')),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  reported_by TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Responders Table
CREATE TABLE IF NOT EXISTS responders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('medical', 'police', 'fire', 'rescue')),
  unit_id TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  current_incident_id UUID REFERENCES incidents(id),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident Assignments
CREATE TABLE IF NOT EXISTS incident_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES responders(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'en_route', 'on_scene', 'completed')),
  UNIQUE(incident_id, responder_id)
);

-- Escalated Sessions (replaces in-memory store)
CREATE TABLE IF NOT EXISTS escalated_sessions (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'other',
  severity TEXT DEFAULT 'MEDIUM',
  summary TEXT DEFAULT 'Emergency',
  status TEXT DEFAULT 'escalated' CHECK (status IN ('escalated', 'assigned', 'connected', 'resolved')),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  assigned_responder JSONB,
  priority INTEGER DEFAULT 3,
  language TEXT DEFAULT 'en',
  image_snapshot TEXT,
  escalated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  qa_report JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communications (two-way messages)
CREATE TABLE IF NOT EXISTS communications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT REFERENCES escalated_sessions(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(type);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responders_status ON responders(status);
CREATE INDEX IF NOT EXISTS idx_responders_role ON responders(role);
CREATE INDEX IF NOT EXISTS idx_escalated_status ON escalated_sessions(status);
CREATE INDEX IF NOT EXISTS idx_escalated_at ON escalated_sessions(escalated_at DESC);
CREATE INDEX IF NOT EXISTS idx_comms_session ON communications(session_id);

-- RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE responders ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalated_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all incidents" ON incidents FOR ALL USING (true);
CREATE POLICY "Allow all responders" ON responders FOR ALL USING (true);
CREATE POLICY "Allow all assignments" ON incident_assignments FOR ALL USING (true);
CREATE POLICY "Allow all sessions" ON escalated_sessions FOR ALL USING (true);
CREATE POLICY "Allow all communications" ON communications FOR ALL USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_responders_updated_at BEFORE UPDATE ON responders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escalated_updated_at BEFORE UPDATE ON escalated_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE escalated_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE communications;
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;

-- Seed Responders
INSERT INTO responders (name, role, unit_id, status, location_lat, location_lng) VALUES
  ('Dr. Priya Sharma', 'medical', 'MED-101', 'available', 28.6139, 77.2090),
  ('Dr. Rahul Verma', 'medical', 'MED-102', 'available', 28.6280, 77.2189),
  ('Paramedic Team Alpha', 'medical', 'MED-103', 'available', 28.6353, 77.2250),
  ('Inspector Raj Kumar', 'police', 'POL-201', 'available', 28.6129, 77.2295),
  ('Constable Amit Singh', 'police', 'POL-202', 'available', 28.6448, 77.2167),
  ('Police Unit Bravo', 'police', 'POL-203', 'available', 28.5921, 77.2461),
  ('Fire Engine Unit 1', 'fire', 'FIRE-301', 'available', 28.6304, 77.2177),
  ('Fire Rescue Alpha', 'fire', 'FIRE-302', 'available', 28.6505, 77.2345),
  ('Rescue Team Delta', 'rescue', 'RES-401', 'available', 28.6181, 77.2024)
ON CONFLICT (unit_id) DO NOTHING;
