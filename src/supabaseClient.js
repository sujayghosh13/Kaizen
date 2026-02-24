import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ddciitaeukigzemqiajq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkY2lpdGFldWtpZ3plbXFpYWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MzQ1MjcsImV4cCI6MjA4NzQxMDUyN30.bnXqJ8_gZm5y60h5Tg61ULeDzehtFWaqK9FjdHC_4Zk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
