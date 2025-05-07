
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ththosnplvqfslavcawn.supabase.co'; // replace with your URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodGhvc25wbHZxZnNsYXZjYXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1ODcyMTksImV4cCI6MjA2MjE2MzIxOX0.tnyte0f4-lf-_aJEpZ0-zBpccDtt4HswFIXyASyDDFk'; // replace with your anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
