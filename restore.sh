#!/bin/bash

# กำหนดตัวแปร
DB_CONTAINER="postgres_maeon"
DB_NAME="maeon_db"
DB_USER="admin"

# ตรวจสอบว่ามีการระบุไฟล์ backup หรือไม่
if [ $# -eq 0 ]; then
    echo "กรุณาระบุไฟล์ backup ที่ต้องการ restore"
    echo "ตัวอย่าง: ./restore.sh ./backups/backup_20230927_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

# ตรวจสอบว่าไฟล์ backup มีอยู่จริง
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ไม่พบไฟล์ backup: $BACKUP_FILE"
    exit 1
fi

# ทำการ restore
echo "กำลัง restore จากไฟล์: $BACKUP_FILE"
gunzip < $BACKUP_FILE | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME

echo "Restore completed"