-- Create table for custom transaction types
CREATE TABLE public.transaction_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all transaction types" 
ON public.transaction_types 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create transaction types" 
ON public.transaction_types 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update transaction types" 
ON public.transaction_types 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete transaction types" 
ON public.transaction_types 
FOR DELETE 
USING (true);

-- Create table for custom categories
CREATE TABLE public.transaction_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all categories" 
ON public.transaction_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create categories" 
ON public.transaction_categories 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update categories" 
ON public.transaction_categories 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete categories" 
ON public.transaction_categories 
FOR DELETE 
USING (true);

-- Insert default transaction types
INSERT INTO public.transaction_types (name) VALUES 
  ('Expense'),
  ('Income'),
  ('Debt Payment'),
  ('Savings'),
  ('Investment');

-- Insert default categories
INSERT INTO public.transaction_categories (name) VALUES 
  ('Food & Dining'),
  ('Shopping'),
  ('Transportation'),
  ('Bills & Utilities'),
  ('Entertainment'),
  ('Health & Fitness'),
  ('Travel'),
  ('Education'),
  ('Gifts & Donations'),
  ('Business Services'),
  ('Other');

-- Add trigger for timestamps on transaction_types
CREATE TRIGGER update_transaction_types_updated_at
BEFORE UPDATE ON public.transaction_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for timestamps on transaction_categories
CREATE TRIGGER update_transaction_categories_updated_at
BEFORE UPDATE ON public.transaction_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();