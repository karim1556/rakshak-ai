-- Rakshak AI Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
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

-- Incident Assignments Table
CREATE TABLE IF NOT EXISTS incident_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES responders(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'en_route', 'on_scene', 'completed')),
  UNIQUE(incident_id, responder_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(type);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responders_status ON responders(status);
CREATE INDEX IF NOT EXISTS idx_responders_role ON responders(role);

-- Enable Row Level Security
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE responders ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_assignments ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now - adjust for production)
CREATE POLICY "Allow all access to incidents" ON incidents FOR ALL USING (true);
CREATE POLICY "Allow all access to responders" ON responders FOR ALL USING (true);
CREATE POLICY "Allow all access to incident_assignments" ON incident_assignments FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responders_updated_at
  BEFORE UPDATE ON responders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Seed Responders
INSERT INTO responders (name, role, unit_id, status, location_lat, location_lng) VALUES
  ('Dr. Priya Sharma', 'medical', 'MED-101', 'available', 28.6139, 77.2090),
  ('Dr. Rahul Verma', 'medical', 'MED-102', 'available', 28.6280, 77.2189),
  ('Paramedic Team Alpha', 'medical', 'MED-103', 'busy', 28.6353, 77.2250),
  ('Inspector Raj Kumar', 'police', 'POL-201', 'available', 28.6129, 77.2295),
  ('Constable Amit Singh', 'police', 'POL-202', 'available', 28.6448, 77.2167),
  ('Police Unit Bravo', 'police', 'POL-203', 'busy', 28.5921, 77.2461),
  ('Fire Engine Unit 1', 'fire', 'FIRE-301', 'available', 28.6304, 77.2177),
  ('Fire Rescue Alpha', 'fire', 'FIRE-302', 'available', 28.6505, 77.2345),
  ('Rescue Team Delta', 'rescue', 'RES-401', 'available', 28.6181, 77.2024)
ON CONFLICT (unit_id) DO NOTHING;

-- Seed Sample Incidents
INSERT INTO incidents (type, summary, description, victims, risks, steps, tactical_advice, severity, status, location_lat, location_lng, location_address) VALUES
  (
    'medical',
    'Cardiac emergency - elderly patient',
    'An elderly man (approx 65 years) collapsed at the market. Bystanders report he was clutching his chest before falling. Currently unconscious.',
    1,
    ARRAY['Cardiac arrest risk', 'Crowd gathering', 'Hot weather conditions'],
    ARRAY['Check for responsiveness', 'Call for help', 'Check breathing', 'If not breathing, start CPR', 'Use AED if available', 'Continue until help arrives'],
    'Possible cardiac arrest. AED and advanced life support may be needed. Clear area for ambulance access.',
    'CRITICAL',
    'active',
    28.6139,
    77.2090,
    'Connaught Place, New Delhi'
  ),
  (
    'accident',
    'Multi-vehicle collision - highway',
    'Three vehicles involved in collision on Ring Road. Multiple injuries reported. Traffic backed up significantly.',
    4,
    ARRAY['Fuel leak possible', 'Traffic hazard', 'Multiple injured persons', 'Glass debris'],
    ARRAY['Secure the scene', 'Check all vehicles for victims', 'Prioritize by injury severity', 'Control traffic flow', 'Document the scene'],
    'Multiple casualties likely. Request additional ambulances. Police needed for traffic control.',
    'HIGH',
    'assigned',
    28.6353,
    77.2250,
    'Ring Road near AIIMS, New Delhi'
  ),
  (
    'fire',
    'Building fire - residential complex',
    'Fire reported on 3rd floor of apartment building. Smoke visible from windows. Residents evacuating.',
    0,
    ARRAY['Smoke inhalation risk', 'Structural damage possible', 'Panicked residents', 'Gas lines nearby'],
    ARRAY['Evacuate the building', 'Do not use elevators', 'Stay low to avoid smoke', 'Call fire department', 'Account for all residents'],
    'Fire spreading. Multiple units required. Check for trapped residents. Gas supply should be cut.',
    'CRITICAL',
    'active',
    28.6280,
    77.2189,
    'Vasant Kunj, New Delhi'
  ),
  (
    'safety',
    'Robbery in progress - jewelry store',
    'Armed robbery reported at jewelry store. Suspects still inside. Hostages possible.',
    3,
    ARRAY['Armed suspects', 'Hostage situation', 'Public area'],
    ARRAY['Do not approach', 'Stay hidden', 'Keep quiet', 'Wait for police', 'Note suspect descriptions'],
    'Armed situation. Do NOT engage. Secure perimeter. Hostage negotiation team may be needed.',
    'CRITICAL',
    'active',
    28.6448,
    77.2167,
    'Karol Bagh Market, New Delhi'
  ),
  (
    'medical',
    'Pregnancy complication - urgent',
    'Pregnant woman (8 months) experiencing severe pain and bleeding. Needs immediate medical attention.',
    2,
    ARRAY['Obstetric emergency', 'Blood loss risk', 'Fetal distress possible'],
    ARRAY['Keep patient calm', 'Lay her down', 'Elevate legs slightly', 'Monitor consciousness', 'Do not give food/water'],
    'Obstetric emergency. Gynecologist and blood units may be needed. Hospital with NICU preferred.',
    'CRITICAL',
    'assigned',
    28.5921,
    77.2461,
    'Saket, New Delhi'
  )
ON CONFLICT DO NOTHING;

-- Assign responders to incidents
INSERT INTO incident_assignments (incident_id, responder_id, status)
SELECT i.id, r.id, 'en_route'
FROM incidents i, responders r
WHERE i.summary LIKE '%Multi-vehicle%' AND r.unit_id = 'MED-103'
ON CONFLICT DO NOTHING;

INSERT INTO incident_assignments (incident_id, responder_id, status)
SELECT i.id, r.id, 'assigned'
FROM incidents i, responders r
WHERE i.summary LIKE '%Pregnancy%' AND r.unit_id = 'MED-101'
ON CONFLICT DO NOTHING;
