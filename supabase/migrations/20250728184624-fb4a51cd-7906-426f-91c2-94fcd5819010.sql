-- Create the missing paycheck_splits table
CREATE TABLE public.paycheck_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  paycheck_amount DECIMAL(10,2) NOT NULL,
  investing_percentage INTEGER NOT NULL DEFAULT 0,
  spending_percentage INTEGER NOT NULL DEFAULT 0,
  savings_percentage INTEGER NOT NULL DEFAULT 0,
  debt_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.paycheck_splits ENABLE ROW LEVEL SECURITY;

-- Create policy for all access (since this is for personal use)
CREATE POLICY "Allow all access to paycheck_splits" 
ON public.paycheck_splits 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_paycheck_splits_updated_at
BEFORE UPDATE ON public.paycheck_splits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();