import { createClient } from '@supabase/supabase-js';

// URL do seu projeto
const supabaseUrl = 'https://rrvfezwegdobpjfrcuik.supabase.co';

// CHAVE PÚBLICA (A que começa com sb_publishable...)
const supabaseKey = 'sb_publishable_oaOOwWLSYtqzCLt60K8b6A_RfEQJhYZ';

export const supabase = createClient(supabaseUrl, supabaseKey);