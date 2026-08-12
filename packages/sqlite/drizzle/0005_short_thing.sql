PRAGMA foreign_keys= OFF;--> statement-breakpoint
CREATE TABLE `__new_deck_candidate`
(
    `id`                          text PRIMARY KEY NOT NULL,
    `label`                       text             NOT NULL,
    `format`                      text             NOT NULL,
    `format_anchor`               text,
    `brief_json`                  text             NOT NULL,
    `collection_import_timestamp` integer,
    `markdown`                    text             NOT NULL,
    `created_at`                  integer          NOT NULL,
    `updated_at`                  integer          NOT NULL,
    CONSTRAINT "deck_candidate_label_check" CHECK (length("label") > 0),
    CONSTRAINT "deck_candidate_format_check" CHECK ("format" IN
                                                    ('commander', 'standard', 'pioneer', 'modern', 'legacy', 'vintage',
                                                     'pauper', 'casual_60'))
);
--> statement-breakpoint
INSERT INTO `__new_deck_candidate`("id", "label", "format", "format_anchor", "brief_json",
                                   "collection_import_timestamp", "markdown", "created_at", "updated_at")
SELECT "id",
       "label",
       "format",
       "format_anchor",
       "brief_json",
       "collection_import_timestamp",
       "markdown",
       "created_at",
       "updated_at"
FROM `deck_candidate`;--> statement-breakpoint
CREATE TABLE `__new_deck_candidate_card`
(
    `id`                text PRIMARY KEY NOT NULL,
    `deck_candidate_id` text             NOT NULL,
    `card_identity_id`  text             NOT NULL,
    `quantity`          integer          NOT NULL,
    `section`           text             NOT NULL,
    `sort_order`        integer          NOT NULL,
    `note`              text,
    FOREIGN KEY (`deck_candidate_id`) REFERENCES `deck_candidate` (`id`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (`card_identity_id`) REFERENCES `card_identity` (`id`) ON UPDATE no action ON DELETE no action,
    CONSTRAINT "deck_candidate_card_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "deck_candidate_card_section_check" CHECK ("section" IN ('commander', 'mainboard', 'sideboard'))
);
--> statement-breakpoint
INSERT INTO `__new_deck_candidate_card`("id", "deck_candidate_id", "card_identity_id", "quantity", "section",
                                        "sort_order", "note")
SELECT "id",
       "deck_candidate_id",
       "card_identity_id",
       "quantity",
       CASE "section" WHEN 'deck' THEN 'mainboard' ELSE "section" END,
       "sort_order",
       "note"
FROM `deck_candidate_card`;--> statement-breakpoint
DROP TABLE `deck_candidate_card`;--> statement-breakpoint
DROP TABLE `deck_candidate`;--> statement-breakpoint
ALTER TABLE `__new_deck_candidate`
    RENAME TO `deck_candidate`;--> statement-breakpoint
ALTER TABLE `__new_deck_candidate_card`
    RENAME TO `deck_candidate_card`;--> statement-breakpoint
CREATE INDEX `idx_deck_candidate_card_deck_candidate_id` ON `deck_candidate_card` (`deck_candidate_id`);--> statement-breakpoint
CREATE INDEX `idx_deck_candidate_card_card_identity_id` ON `deck_candidate_card` (`card_identity_id`);--> statement-breakpoint
CREATE TABLE `__new_card_identity`
(
    `id`                          text PRIMARY KEY      NOT NULL,
    `name`                        text                  NOT NULL,
    `layout`                      text DEFAULT 'normal' NOT NULL,
    `mana_cost`                   text,
    `mana_value`                  real                  NOT NULL,
    `type_line`                   text                  NOT NULL,
    `oracle_text`                 text,
    `copy_limit_override_kind`    text                  NOT NULL,
    `copy_limit_override_maximum` integer,
    `color_identity`              text DEFAULT ''       NOT NULL,
    `colors`                      text,
    `color_indicator`             text,
    `produced_mana`               text,
    `keywords_json`               text DEFAULT '[]'     NOT NULL,
    `power`                       text,
    `toughness`                   text,
    `loyalty`                     text,
    `defense`                     text,
    `edhrec_rank`                 integer,
    `game_changer`                integer               NOT NULL,
    `source_page_uri`             text                  NOT NULL,
    CONSTRAINT "card_identity_color_identity_check" CHECK (color_identity IN
                                                           ('', 'W', 'U', 'B', 'R', 'G', 'WU', 'WB', 'WR', 'WG', 'UB',
                                                            'UR', 'UG', 'BR', 'BG', 'RG', 'WUB', 'WUR', 'WUG', 'WBR',
                                                            'WBG', 'WRG', 'UBR', 'UBG', 'URG', 'BRG', 'WUBR', 'WUBG',
                                                            'WURG', 'WBRG', 'UBRG', 'WUBRG')),
    CONSTRAINT "card_identity_copy_limit_override_check" CHECK (("copy_limit_override_kind" = 'maximum' AND
                                                                 "copy_limit_override_maximum" IS NOT NULL AND
                                                                 "copy_limit_override_maximum" > 0) OR
                                                                ("copy_limit_override_kind" IN ('none', 'unlimited') AND
                                                                 "copy_limit_override_maximum" IS NULL))
);
--> statement-breakpoint
INSERT INTO `__new_card_identity`("id", "name", "layout", "mana_cost", "mana_value", "type_line", "oracle_text",
                                  "copy_limit_override_kind", "copy_limit_override_maximum", "color_identity", "colors",
                                  "color_indicator", "produced_mana", "keywords_json", "power", "toughness", "loyalty",
                                  "defense", "edhrec_rank", "game_changer", "source_page_uri")
SELECT "id",
       "name",
       "layout",
       "mana_cost",
       "mana_value",
       "type_line",
       "oracle_text",
       'none',
       NULL,
       "color_identity",
       "colors",
       "color_indicator",
       "produced_mana",
       "keywords_json",
       "power",
       "toughness",
       "loyalty",
       "defense",
       "edhrec_rank",
       "game_changer",
       "source_page_uri"
FROM `card_identity`;--> statement-breakpoint
DROP TABLE `card_identity`;--> statement-breakpoint
ALTER TABLE `__new_card_identity`
    RENAME TO `card_identity`;--> statement-breakpoint
CREATE INDEX `idx_card_identity_color_identity` ON `card_identity` (`color_identity`);--> statement-breakpoint
CREATE INDEX `idx_card_identity_name` ON `card_identity` (`name`);--> statement-breakpoint
CREATE INDEX `idx_card_identity_type_line` ON `card_identity` (`type_line`);--> statement-breakpoint
CREATE INDEX `idx_card_identity_mana_value` ON `card_identity` (`mana_value`);--> statement-breakpoint
CREATE INDEX `idx_card_identity_colors` ON `card_identity` (`colors`);--> statement-breakpoint
CREATE INDEX `idx_card_identity_game_changer` ON `card_identity` (`game_changer`);--> statement-breakpoint
CREATE INDEX `idx_card_identity_edhrec_rank` ON `card_identity` (`edhrec_rank`);--> statement-breakpoint
CREATE TABLE `__new_scryfall_bulk_data_import`
(
    `id`                       text PRIMARY KEY     NOT NULL,
    `bulk_data_type`           text                 NOT NULL,
    `import_contract_revision` integer              NOT NULL,
    `status`                   text                 NOT NULL,
    `started_at`               integer              NOT NULL,
    `completed_at`             integer,
    `source_updated_at`        integer,
    `source_uri`               text,
    `imported_record_count`    integer DEFAULT 0    NOT NULL,
    `warnings_json`            text    DEFAULT '[]' NOT NULL,
    `blocking_errors_json`     text    DEFAULT '[]' NOT NULL,
    CONSTRAINT "scryfall_bulk_data_import_bulk_data_type_check" CHECK ("bulk_data_type" IN ('oracle_cards', 'all_cards', 'oracle_tags')),
    CONSTRAINT "scryfall_bulk_data_import_status_check" CHECK ("status" IN ('succeeded', 'failed'))
);--> statement-breakpoint
INSERT INTO `__new_scryfall_bulk_data_import`("id", "bulk_data_type", "import_contract_revision", "status",
                                              "started_at", "completed_at", "source_updated_at", "source_uri",
                                              "imported_record_count", "warnings_json", "blocking_errors_json")
SELECT "id",
       "bulk_data_type",
       0,
       "status",
       "started_at",
       "completed_at",
       "source_updated_at",
       "source_uri",
       "imported_record_count",
       "warnings_json",
       "blocking_errors_json"
FROM `scryfall_bulk_data_import`;--> statement-breakpoint
DROP TABLE `scryfall_bulk_data_import`;--> statement-breakpoint
ALTER TABLE `__new_scryfall_bulk_data_import`
    RENAME TO `scryfall_bulk_data_import`;
