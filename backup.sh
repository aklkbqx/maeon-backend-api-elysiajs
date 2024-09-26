#!/bin/bash

# กำหนดตัวแปร
DB_CONTAINER="postgres_maeon"
DB_NAME="maeon_db"
DB_USER="admin"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# สร้างโฟลเดอร์ backup ถ้ายังไม่มี
mkdir -p $BACKUP_DIR

# ทำการ backup
docker exec -t $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

# บีบอัดไฟล์ backup
gzip $BACKUP_FILE

echo "Backup completed: ${BACKUP_FILE}.gz"