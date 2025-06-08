CREATE TABLE IF NOT EXISTS approvals (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    requester_id INTEGER NOT NULL REFERENCES employees(id),
    approver_id INTEGER REFERENCES employees(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT valid_type CHECK (type IN ('work_schedule', 'leave', 'overtime'))
);

CREATE INDEX idx_approvals_requester ON approvals(requester_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_type ON approvals(type);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_approvals_updated_at
    BEFORE UPDATE ON approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_approvals_updated_at(); 