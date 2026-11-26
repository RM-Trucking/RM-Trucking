-- Set CURRENT SCHEMA to the configured DB2_LIBRARY before running this migration.
CREATE TABLE "UserStationAssignment" (
    "userId" BIGINT NOT NULL,
    "stationId" BIGINT NOT NULL,
    PRIMARY KEY ("userId", "stationId")
);
