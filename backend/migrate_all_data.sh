#!/bin/bash

# Script completo de migración de datos a Supabase
# Fecha: 2025-08-12

SOURCE_HOST="localhost"
SOURCE_PORT="5432"
SOURCE_USER="tucanlink"
SOURCE_PASS="tucanlink2024"
SOURCE_DB="tucanlink"

TARGET_HOST="aws-0-us-east-2.pooler.supabase.com"
TARGET_PORT="6543"
TARGET_USER="postgres.qwonjgkuriljnmuaoccp"
TARGET_PASS="Abril24++"
TARGET_DB="postgres"

echo "==========================================="
echo "MIGRACIÓN COMPLETA DE DATOS A SUPABASE"
echo "==========================================="
echo ""

# Función para migrar una tabla
migrate_table() {
    local TABLE=$1
    echo "Migrando tabla: $TABLE"
    
    # Limpiar datos existentes en destino (opcional, comentar si no se desea)
    PGPASSWORD="$TARGET_PASS" psql -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" \
        -c "TRUNCATE TABLE \"$TABLE\" CASCADE;" 2>/dev/null
    
    # Exportar datos con COPY
    PGPASSWORD="$SOURCE_PASS" pg_dump -h "$SOURCE_HOST" -p "$SOURCE_PORT" -U "$SOURCE_USER" -d "$SOURCE_DB" \
        -t "\"$TABLE\"" --data-only --no-owner --no-acl --column-inserts \
        -f "/tmp/${TABLE}_data.sql"
    
    # Importar en Supabase
    PGPASSWORD="$TARGET_PASS" psql -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" \
        -f "/tmp/${TABLE}_data.sql"
    
    # Obtener conteos
    SOURCE_COUNT=$(PGPASSWORD="$SOURCE_PASS" psql -h "$SOURCE_HOST" -p "$SOURCE_PORT" -U "$SOURCE_USER" -d "$SOURCE_DB" \
        -t -c "SELECT COUNT(*) FROM \"$TABLE\"" | tr -d ' ')
    
    TARGET_COUNT=$(PGPASSWORD="$TARGET_PASS" psql -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" \
        -t -c "SELECT COUNT(*) FROM \"$TABLE\"" | tr -d ' ')
    
    if [ "$SOURCE_COUNT" = "$TARGET_COUNT" ]; then
        echo "✅ $TABLE: $SOURCE_COUNT registros migrados correctamente"
    else
        echo "❌ ERROR en $TABLE: Origen=$SOURCE_COUNT, Destino=$TARGET_COUNT"
        return 1
    fi
    
    # Limpiar archivo temporal
    rm -f "/tmp/${TABLE}_data.sql"
}

# Función para ajustar secuencias
adjust_sequences() {
    echo ""
    echo "Ajustando secuencias..."
    
    PGPASSWORD="$TARGET_PASS" psql -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" <<EOF
DO \$\$
DECLARE
    r RECORD;
    max_id INTEGER;
BEGIN
    FOR r IN 
        SELECT 
            table_name::text,
            column_name::text,
            pg_get_serial_sequence('"' || table_name || '"', column_name) as seq_name
        FROM information_schema.columns 
        WHERE column_default LIKE 'nextval%'
        AND table_schema = 'public'
        AND table_name IN (
            'Announcements', 'Baileys', 'BaileysChats', 'BaileysMessages',
            'CampaignSettings', 'CampaignShipping', 'Campaigns', 'ChatMessages',
            'Chats', 'ChatUsers', 'Companies', 'ContactCustomFields',
            'ContactListItems', 'ContactLists', 'Contacts', 'Files',
            'FilesOptions', 'FlowAudios', 'FlowBuilders', 'FlowCampaigns',
            'FlowDefaults', 'FlowImgs', 'Helps', 'Invoices', 'Messages',
            'Plans', 'Prompts', 'QueueIntegrations', 'QueueOptions',
            'Queues', 'QuickMessages', 'Schedules', 'Settings',
            'Subscriptions', 'Tags', 'TicketNotes', 'TicketTags',
            'TicketTraking', 'Tickets', 'UserQueues', 'UserRatings',
            'Users', 'Webhooks', 'WhatsappQueues', 'Whatsapps'
        )
    LOOP
        IF r.seq_name IS NOT NULL THEN
            EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', r.column_name, r.table_name) INTO max_id;
            IF max_id > 0 THEN
                EXECUTE format('SELECT setval(%L, %s)', r.seq_name, max_id);
                RAISE NOTICE 'Ajustada secuencia % a %', r.seq_name, max_id;
            END IF;
        END IF;
    END LOOP;
END \$\$;
EOF
    
    echo "✅ Secuencias ajustadas"
}

# Arrays de tablas organizadas por grupos de dependencias
echo "Iniciando migración por grupos de dependencias..."
echo ""

# Grupo 1: Tablas maestras sin dependencias
echo "=== GRUPO 1: Tablas maestras ==="
TABLES_GROUP_1=(
    "Plans"
    "Helps"
    "SequelizeMeta"
)

for table in "${TABLES_GROUP_1[@]}"; do
    migrate_table "$table"
done

# Grupo 2: Companies (ya migrada) y dependientes directos
echo ""
echo "=== GRUPO 2: Companies y configuraciones ==="
TABLES_GROUP_2=(
    # "Companies" # Ya migrada
    # "Users" # Ya migrada
    # "Settings" # Ya migrada
    "Tags"
    "Announcements"
)

for table in "${TABLES_GROUP_2[@]}"; do
    migrate_table "$table"
done

# Grupo 3: WhatsApp, Colas e Integraciones
echo ""
echo "=== GRUPO 3: WhatsApp y Colas ==="
TABLES_GROUP_3=(
    "Whatsapps"
    "Prompts"
    "QueueIntegrations"
    "Queues"
    "QueueOptions"
    "WhatsappQueues"
    "UserQueues"
    "Baileys"
    "BaileysChats"
    "BaileysMessages"
)

for table in "${TABLES_GROUP_3[@]}"; do
    migrate_table "$table"
done

# Grupo 4: Contactos y Listas
echo ""
echo "=== GRUPO 4: Contactos y Listas ==="
TABLES_GROUP_4=(
    "Contacts"
    "ContactCustomFields"
    "ContactLists"
    "ContactListItems"
)

for table in "${TABLES_GROUP_4[@]}"; do
    migrate_table "$table"
done

# Grupo 5: Tickets y Mensajes
echo ""
echo "=== GRUPO 5: Tickets y Mensajes ==="
TABLES_GROUP_5=(
    "Tickets"
    "Messages"
    "TicketNotes"
    "TicketTags"
    "TicketTraking"
    "UserRatings"
)

for table in "${TABLES_GROUP_5[@]}"; do
    migrate_table "$table"
done

# Grupo 6: Campañas y Flow Builder
echo ""
echo "=== GRUPO 6: Campañas y Flow Builder ==="
TABLES_GROUP_6=(
    "Campaigns"
    "CampaignSettings"
    "CampaignShipping"
    "FlowBuilders"
    "FlowCampaigns"
    "FlowDefaults"
    "FlowImgs"
    "FlowAudios"
)

for table in "${TABLES_GROUP_6[@]}"; do
    migrate_table "$table"
done

# Grupo 7: Chat interno y otros
echo ""
echo "=== GRUPO 7: Chat y Utilidades ==="
TABLES_GROUP_7=(
    "Chats"
    "ChatUsers"
    "ChatMessages"
    "Schedules"
    "QuickMessages"
    "Files"
    "FilesOptions"
    "Webhooks"
    "Subscriptions"
    "Invoices"
)

for table in "${TABLES_GROUP_7[@]}"; do
    migrate_table "$table"
done

# Ajustar secuencias
adjust_sequences

echo ""
echo "==========================================="
echo "RESUMEN DE LA MIGRACIÓN"
echo "==========================================="

# Mostrar conteo total
TOTAL_TABLES=$(PGPASSWORD="$TARGET_PASS" psql -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'" | tr -d ' ')

TOTAL_RECORDS=$(PGPASSWORD="$TARGET_PASS" psql -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" \
    -t -c "SELECT SUM(n_live_tup) FROM pg_stat_user_tables" | tr -d ' ')

echo "Total de tablas: $TOTAL_TABLES"
echo "Total de registros: $TOTAL_RECORDS"
echo ""
echo "✅ Migración completada!"
echo "==========================================="