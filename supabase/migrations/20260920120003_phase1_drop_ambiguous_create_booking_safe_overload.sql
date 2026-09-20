-- GoAir — Phase 1 / Migration 3
-- create_booking_safe كان له نسختين (22 و23 parameter). أي نداء بدون p_group_id كان "is not unique".
-- بنسيب نسخة الـ23 (فيها p_group_id بقيمة افتراضية null) وتغطي كل النداءات القديمة.
drop function if exists public.create_booking_safe(uuid, uuid, uuid, date, timestamp with time zone, integer, text, text, integer, text, text, uuid, text, uuid[], text[], uuid[], text, text, text, text, text, text);
