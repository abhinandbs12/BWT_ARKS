-- CredIQ Scam Reports Table
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard

CREATE TABLE IF NOT EXISTS scam_reports (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone           TEXT,
  upi_id          TEXT,
  vpa             TEXT,
  scam_type       TEXT NOT NULL,
  description     TEXT NOT NULL,
  reports_count   INT  DEFAULT 1,
  confidence_score INT DEFAULT 80 CHECK (confidence_score BETWEEN 0 AND 100),
  first_reported  TIMESTAMPTZ DEFAULT NOW(),
  last_reported   TIMESTAMPTZ DEFAULT NOW(),
  is_verified     BOOLEAN DEFAULT FALSE,
  reported_by     TEXT DEFAULT 'community'
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_scam_phone   ON scam_reports (phone);
CREATE INDEX IF NOT EXISTS idx_scam_upi     ON scam_reports (upi_id);
CREATE INDEX IF NOT EXISTS idx_scam_vpa     ON scam_reports (vpa);

-- Enable Row Level Security
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;

-- Allow public read (anyone can look up)
CREATE POLICY "Public read" ON scam_reports
  FOR SELECT USING (true);

-- Allow authenticated insert/update (community reports)
CREATE POLICY "Anyone can insert" ON scam_reports
  FOR INSERT WITH CHECK (true);

-- Helper RPC to increment report count
CREATE OR REPLACE FUNCTION increment_report_count(record_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE scam_reports
  SET reports_count = reports_count + 1,
      last_reported = NOW()
  WHERE id = record_id;
END;
$$;

-- ─── Seed Data ────────────────────────────────────────────────────────────────

INSERT INTO scam_reports (phone, scam_type, description, reports_count, confidence_score, is_verified, reported_by) VALUES
('+919876543210', 'fake_bank_call',   'Calls pretending to be HDFC Bank KYC team, asks for OTP and UPI PIN.', 847, 98, TRUE, 'hdfc_bank'),
('+918899001122', 'investment_fraud', 'WhatsApp group scam promising 100x returns in BTC mining. Asks ₹5000 to join.', 234, 95, TRUE, 'community'),
('+917788990011', 'lottery_scam',     'Claims user won ₹25 lakh in lucky draw. Demands ₹2000 processing fee.', 1203, 99, TRUE, 'community'),
('+919988776655', 'kyc_fraud',        'SBI account freeze threat, asks to share screen for KYC via TeamViewer.', 556, 96, TRUE, 'sbi_bank');

INSERT INTO scam_reports (upi_id, vpa, scam_type, description, reports_count, confidence_score, is_verified, reported_by) VALUES
('kyc.hdfc@ybl',        'kyc.hdfc@ybl',    'upi_phishing', 'Fake HDFC UPI ID for KYC scam, requests ₹1 to activate account.', 312, 97, TRUE, 'npci'),
('prize.winner@paytm',  'prize.winner@paytm', 'lottery_scam', 'Fake prize UPI - asks ₹500 fee to release ₹5 lakh prize.', 89, 92, FALSE, 'community'),
('refund.support@ybl',  'refund.support@ybl', 'upi_phishing', 'Fake refund UPI ID, sends payment request instead of refund.', 203, 94, TRUE, 'community');
