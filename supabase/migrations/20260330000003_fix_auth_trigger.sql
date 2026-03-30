-- ================================================================
-- Remove trigger padrão do Supabase que conflita com nosso schema
-- O trigger on_auth_user_created chama handle_new_user() que tenta
-- inserir na coluna full_name (inexistente) em public.profiles.
-- Nosso trigger tr_create_profile_on_signup usa fn_create_profile_on_signup()
-- que já está correto para o schema do Bastion.
-- ================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
