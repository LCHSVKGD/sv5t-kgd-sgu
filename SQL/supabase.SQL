-- ===== BẢNG TIN NHẮN HỎI ĐÁP (sinh viên <-> Ban Chấp hành) =====
-- Cách chạy: Supabase -> SQL Editor -> New query -> dán toàn bộ file này -> Run.

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references auth.users(id) on delete cascade,  -- sinh viên mà cuộc trò chuyện thuộc về
  sender      text not null check (sender in ('student', 'admin')),        -- 'student' = sinh viên gửi, 'admin' = BCH trả lời
  body        text not null check (char_length(btrim(body)) between 1 and 3000),
  created_at  timestamptz not null default now()
);

create index if not exists messages_student_time_idx on public.messages (student_id, created_at);

-- Bảo mật: mỗi sinh viên chỉ thấy và chỉ gửi được tin nhắn của chính mình
alter table public.messages enable row level security;

drop policy if exists "sinh vien doc tin cua minh" on public.messages;
create policy "sinh vien doc tin cua minh"
  on public.messages for select to authenticated
  using (auth.uid() = student_id);

drop policy if exists "sinh vien gui tin cua minh" on public.messages;
create policy "sinh vien gui tin cua minh"
  on public.messages for insert to authenticated
  with check (auth.uid() = student_id and sender = 'student');

-- Bật nhận tin mới theo thời gian thực (BCH trả lời là hiện ngay, không cần tải lại trang)
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then
  null;  -- đã bật rồi thì bỏ qua
end $$;

-- BCH trả lời tạm thời: Table Editor -> bảng messages -> Insert row
--   student_id = mã (UUID) của sinh viên, lấy ở Authentication -> Users
--   sender     = admin
--   body       = nội dung trả lời
