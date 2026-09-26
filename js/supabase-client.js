import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://aemyezvaiwousiutgbla.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbXllenZhaXdvdXNpdXRnYmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDU0MTMsImV4cCI6MjEwNTgyMTQxM30.MabL-D1nBvMh5s_CVzvfZFP5q-mWYSVunVbZjeDdDQk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);