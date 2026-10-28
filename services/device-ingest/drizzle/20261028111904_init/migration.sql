CREATE TABLE "commands_metadata" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "commands_metadata_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"command_id" varchar(100) NOT NULL,
	"component_id" varchar(100) NOT NULL,
	"device_id" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"command" varchar(100) NOT NULL,
	"command_topic" varchar(100) NOT NULL,
	"allowed_values" varchar(50)[],
	"min_value" numeric,
	"max_value" numeric,
	"description" text,
	CONSTRAINT "commands_metadata_command_component_device_uniq" UNIQUE("device_id","component_id","command_id")
);
--> statement-breakpoint
CREATE TABLE "components" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "components_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"component_id" varchar(100) NOT NULL,
	"device_id" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar NOT NULL,
	CONSTRAINT "components_device_component_unique" UNIQUE("device_id","component_id")
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" varchar(100) PRIMARY KEY,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metrics_metadata" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "metrics_metadata_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"metric_id" varchar(100) NOT NULL,
	"component_id" varchar(100) NOT NULL,
	"device_id" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"metric" varchar(100) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"min_value" numeric,
	"max_value" numeric,
	CONSTRAINT "metrics_metadata_metric_component_device_uniq" UNIQUE("device_id","component_id","metric_id")
);
--> statement-breakpoint
ALTER TABLE "commands_metadata" ADD CONSTRAINT "commands_metadata_VDyNEE9qznpV_fkey" FOREIGN KEY ("device_id","component_id") REFERENCES "components"("device_id","component_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_device_id_devices_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "metrics_metadata" ADD CONSTRAINT "metrics_metadata_RJclZB0QL2Zq_fkey" FOREIGN KEY ("device_id","component_id") REFERENCES "components"("device_id","component_id") ON DELETE CASCADE;