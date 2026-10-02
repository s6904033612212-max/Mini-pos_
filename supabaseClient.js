import { createClient } from '@supabase/supabase-js';

// ค่าเหล่านี้ไม่ได้เขียนในโค้ด แต่ตั้งไว้ใน Vercel → Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
