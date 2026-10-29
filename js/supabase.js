// Kết nối web với Supabase (chỉ để ĐỌC nội dung công khai). Khóa "publishable" được phép nằm trong code web.
var SUPABASE_URL = 'https://hefcjivkcqlezfunlhtw.supabase.co';
var SUPABASE_KEY = 'sb_publishable_seo1TAxIPUfiJRHmanLklQ_f5em_vAn';
var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});
