CREATE TABLE `card_printing_promo_type` (
	`card_printing_id` text NOT NULL,
	`promo_type` text NOT NULL,
	PRIMARY KEY(`card_printing_id`, `promo_type`),
	FOREIGN KEY (`card_printing_id`) REFERENCES `card_printing`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "card_printing_promo_type_check" CHECK(length("card_printing_promo_type"."promo_type") > 0)
);
--> statement-breakpoint
CREATE INDEX `idx_card_printing_promo_type_card_printing_id` ON `card_printing_promo_type` (`card_printing_id`);--> statement-breakpoint
CREATE TABLE `card_set` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`set_type` text NOT NULL,
	`api_uri` text NOT NULL,
	`card_search_uri` text NOT NULL,
	`source_page_uri` text NOT NULL,
	CONSTRAINT "card_set_code_check" CHECK(length("card_set"."code") > 0),
	CONSTRAINT "card_set_name_check" CHECK(length("card_set"."name") > 0),
	CONSTRAINT "card_set_set_type_check" CHECK(length("card_set"."set_type") > 0),
	CONSTRAINT "card_set_api_uri_check" CHECK(length("card_set"."api_uri") > 0),
	CONSTRAINT "card_set_card_search_uri_check" CHECK(length("card_set"."card_search_uri") > 0),
	CONSTRAINT "card_set_source_page_uri_check" CHECK(length("card_set"."source_page_uri") > 0)
);
--> statement-breakpoint
CREATE INDEX `idx_card_set_name` ON `card_set` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `card_set_code_unique` ON `card_set` (`code`);--> statement-breakpoint
ALTER TABLE `card_printing` ADD `set_id` text NOT NULL REFERENCES card_set(id);--> statement-breakpoint
CREATE INDEX `idx_card_printing_set_id` ON `card_printing` (`set_id`);--> statement-breakpoint
ALTER TABLE `card_printing` DROP COLUMN `set_code`;