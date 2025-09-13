import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://wjkougtqduxjqwhwxbyv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqa291Z3RxZHV4anF3aHd4Ynl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNDMwOTMsImV4cCI6MjA3MjYxOTA5M30.hudENbd93YwmsHeZJhDGoBuPI9WZAlkB1BZli5InpVo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
