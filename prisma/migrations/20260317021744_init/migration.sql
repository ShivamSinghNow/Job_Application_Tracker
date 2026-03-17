-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "salary_range" TEXT,
    "summary" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "nice_to_haves" TEXT NOT NULL,
    "fit_score" INTEGER NOT NULL,
    "fit_reasoning" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
