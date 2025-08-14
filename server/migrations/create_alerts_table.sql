-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('delay', 'cancellation', 'platform_change', 'service_update', 'weather')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    train_id INTEGER REFERENCES trains(id),
    station_id INTEGER REFERENCES stations(id),
    is_read BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- Insert some sample alerts
INSERT INTO alerts (type, severity, title, message, train_id, station_id) VALUES
('delay', 'warning', 'Train Delay', 'Udarata Menike (Train #1001) is delayed by 15 minutes due to signal issues.', 1, 3),
('cancellation', 'error', 'Service Cancellation', 'Evening Express (Train #1015) service has been cancelled due to technical issues.', 3, NULL),
('platform_change', 'info', 'Platform Change', 'Podi Menike (Train #1005) will depart from Platform 3 instead of Platform 2.', 2, 1),
('service_update', 'info', 'Service Update', 'Additional coaches have been added to Intercity Express due to high demand.', 4, NULL),
('weather', 'warning', 'Weather Alert', 'Heavy rainfall expected in the hill country. Train services may experience delays.', NULL, NULL);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
