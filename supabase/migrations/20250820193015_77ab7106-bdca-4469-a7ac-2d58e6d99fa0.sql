-- Confirmar usuarios pendientes para permitir login
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;