-- ============================================================================
-- قرار العمل: GoAir مش شركة خدمات أرضية، فمش هتضيف خدمات إضافية جديدة.
-- GoAir بتتحكم بس في: تأمين الرحلة + eSIM.
-- باقي الخدمات الحالية (18 خدمة) بتتبع شركة الطيران، وشركتها الأرضية بإذنها،
-- بنفس نظام ground_handling_services. لحد ما الشركات دي تدخل خدماتها بنفسها،
-- الخدمات دي بتفضل ظاهرة للعميل بأسعارها الحالية كـ "مؤقتة" (transitional).
--
-- الملف idempotent (تشغيله أكتر من مرة آمن) ومتراجع عليه قبل التطبيق.
-- مفيش أي حجز استخدم خدمة من addon_services لحد وقت كتابة الملف (0 صفوف في
-- booking_addon_services)، فالتعديل مفيهوش أثر على بيانات موجودة.
-- ============================================================================

-- 1) عمود المالك
alter table public.addon_services
  add column if not exists owner_type text not null default 'transitional';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.addon_services'::regclass
      and conname = 'addon_services_owner_type_check'
  ) then
    alter table public.addon_services
      add constraint addon_services_owner_type_check
      check (owner_type in ('goair', 'transitional'));
  end if;
end $$;

-- 2) التأمين وeSIM يفضلوا تحت تحكم GoAir، والباقي مؤقت
update public.addon_services
   set owner_type = 'goair'
 where name_en in ('Trip Insurance', 'Local eSIM');

-- 3) الإضافة الجديدة مقفولة على GoAir (كانت finance/super_admin)
create or replace function public.admin_create_addon_service(
  p_access_token text, p_name_ar text, p_description_ar text, p_category text,
  p_price_usd numeric, p_icon_name text, p_is_highlighted boolean default false,
  p_sort_order integer default 0
) returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if not staff_has_role(p_access_token, 'super_admin', 'finance') then
    raise exception 'بس finance/super_admin يقدروا يدخلوا على الخدمات الإضافية';
  end if;
  raise exception 'GoAir مبتضيفش خدمات إضافية جديدة — الخدمات الأرضية بتتحكم فيها شركة الطيران وشركتها الأرضية من بوابتهم';
end; $function$;

-- 4) التعديل: خدمات GoAir (تأمين/eSIM) تتعدل كاملة،
--    الخدمات المؤقتة يتغير فيها التفعيل/الإيقاف بس (مفيش تغيير اسم/سعر/فئة)
create or replace function public.admin_update_addon_service(
  p_access_token text, p_id uuid, p_name_ar text, p_description_ar text, p_category text,
  p_price_usd numeric, p_icon_name text, p_is_highlighted boolean, p_is_active boolean,
  p_sort_order integer
) returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_old record; v_actor record;
begin
  if not staff_has_role(p_access_token, 'super_admin', 'finance') then
    raise exception 'بس finance/super_admin يقدروا يعدّلوا خدمة إضافية';
  end if;

  select name_ar, category, price_usd, is_active, owner_type into v_old
    from addon_services where id = p_id;
  if not found then raise exception 'الخدمة الإضافية غير موجودة'; end if;

  if v_old.owner_type = 'transitional' then
    if p_name_ar is distinct from v_old.name_ar
       or p_category is distinct from v_old.category
       or p_price_usd is distinct from v_old.price_usd then
      raise exception 'الخدمة دي مؤقتة وتتبع شركة الطيران/الأرضية — تقدر بس توقفها أو تفعّلها';
    end if;
    update addon_services set is_active = p_is_active where id = p_id;
  else
    update addon_services set name_ar = p_name_ar, description_ar = p_description_ar, category = p_category,
      price_usd = p_price_usd, icon_name = p_icon_name, is_highlighted = p_is_highlighted,
      is_active = p_is_active, sort_order = p_sort_order
    where id = p_id;
  end if;

  select * into v_actor from public._resolve_staff_actor(p_access_token);
  perform public._record_audit_log('staff', v_actor.staff_id, v_actor.staff_role,
    'addon_service.update', 'addon_services', p_id,
    to_jsonb(v_old),
    jsonb_build_object('name_ar', p_name_ar, 'category', p_category, 'price_usd', p_price_usd,
                       'is_active', p_is_active, 'owner_type', v_old.owner_type), null);
end; $function$;

-- admin_delete_addon_service (إيقاف ناعم) و admin_list_addon_services (select *) بيفضلوا زي ما هم.
