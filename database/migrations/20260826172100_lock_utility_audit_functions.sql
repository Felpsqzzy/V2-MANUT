revoke all on function public.log_utility_meter_insert() from public, anon, authenticated;
revoke all on function public.log_utility_reading_insert() from public, anon, authenticated;
grant execute on function public.log_utility_meter_insert() to postgres;
grant execute on function public.log_utility_reading_insert() to postgres;
