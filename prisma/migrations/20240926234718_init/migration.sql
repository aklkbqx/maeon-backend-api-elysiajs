-- CreateTable
CREATE TABLE "programactivities" (
    "id" SERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "sequence_order" INTEGER NOT NULL,

    CONSTRAINT "programactivities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "programactivities" ADD CONSTRAINT "programactivities_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programactivities" ADD CONSTRAINT "programactivities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
