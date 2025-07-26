-- Create paycheck_splits table
CREATE TABLE IF NOT EXISTS paycheck_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  paycheck_amount DECIMAL(10,2) NOT NULL,
  investing_percentage DECIMAL(5,2) NOT NULL,
  spending_percentage DECIMAL(5,2) NOT NULL,
  savings_percentage DECIMAL(5,2) NOT NULL,
  debt_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE paycheck_splits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON paycheck_splits FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON paycheck_splits FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON paycheck_splits FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON paycheck_splits FOR DELETE USING (true); 