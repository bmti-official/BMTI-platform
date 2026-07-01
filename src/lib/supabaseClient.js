import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fiesnznufryrkxcpwuja.supabase.co';
const supabaseKey = 'sb_publishable_eJEbt-Raw_UTFDDghG9nqQ_x32PXONo';

export const supabase = createClient(supabaseUrl, supabaseKey);
