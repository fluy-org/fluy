DO $$
BEGIN
  IF EXISTS (
    WITH clientes_normalizados AS (
      SELECT
        "salao_id",
        CASE
          WHEN btrim("whatsapp") LIKE '+%' THEN
            '+' || regexp_replace("whatsapp", '\D', '', 'g')
          WHEN length(regexp_replace("whatsapp", '\D', '', 'g')) IN (10, 11) THEN
            '+55' || regexp_replace("whatsapp", '\D', '', 'g')
          ELSE
            '+' || regexp_replace("whatsapp", '\D', '', 'g')
        END AS "whatsapp_normalizado"
      FROM "cliente"
    )
    SELECT 1
    FROM clientes_normalizados
    GROUP BY "salao_id", "whatsapp_normalizado"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'A normalização encontrou clientes duplicados pelo WhatsApp no mesmo salão.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "cliente"
    WHERE (
      CASE
        WHEN btrim("whatsapp") LIKE '+%' THEN
          '+' || regexp_replace("whatsapp", '\D', '', 'g')
        WHEN length(regexp_replace("whatsapp", '\D', '', 'g')) IN (10, 11) THEN
          '+55' || regexp_replace("whatsapp", '\D', '', 'g')
        ELSE
          '+' || regexp_replace("whatsapp", '\D', '', 'g')
      END
    ) !~ '^\+[1-9][0-9]{7,14}$'
  ) THEN
    RAISE EXCEPTION 'Existem clientes com WhatsApp inválido; corrija-os antes da migração.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "salao"
    WHERE (
      CASE
        WHEN btrim("contato_whatsapp") LIKE '+%' THEN
          '+' || regexp_replace("contato_whatsapp", '\D', '', 'g')
        WHEN length(regexp_replace("contato_whatsapp", '\D', '', 'g')) IN (10, 11) THEN
          '+55' || regexp_replace("contato_whatsapp", '\D', '', 'g')
        ELSE
          '+' || regexp_replace("contato_whatsapp", '\D', '', 'g')
      END
    ) !~ '^\+[1-9][0-9]{7,14}$'
  ) THEN
    RAISE EXCEPTION 'Existem salões com WhatsApp inválido; corrija-os antes da migração.';
  END IF;
END $$;
--> statement-breakpoint
UPDATE "cliente"
SET "whatsapp" = CASE
  WHEN btrim("whatsapp") LIKE '+%' THEN
    '+' || regexp_replace("whatsapp", '\D', '', 'g')
  WHEN length(regexp_replace("whatsapp", '\D', '', 'g')) IN (10, 11) THEN
    '+55' || regexp_replace("whatsapp", '\D', '', 'g')
  ELSE
    '+' || regexp_replace("whatsapp", '\D', '', 'g')
END;
--> statement-breakpoint
UPDATE "salao"
SET "contato_whatsapp" = CASE
  WHEN btrim("contato_whatsapp") LIKE '+%' THEN
    '+' || regexp_replace("contato_whatsapp", '\D', '', 'g')
  WHEN length(regexp_replace("contato_whatsapp", '\D', '', 'g')) IN (10, 11) THEN
    '+55' || regexp_replace("contato_whatsapp", '\D', '', 'g')
  ELSE
    '+' || regexp_replace("contato_whatsapp", '\D', '', 'g')
END;
