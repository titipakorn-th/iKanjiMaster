CREATE TABLE `deck_kanjis` (
	`id` text PRIMARY KEY NOT NULL,
	`deck_id` text NOT NULL,
	`kanji_id` text NOT NULL,
	`position` integer DEFAULT 0,
	`created_at` text NOT NULL,
	FOREIGN KEY (`deck_id`) REFERENCES `study_decks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kanji_id`) REFERENCES `kanjis`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `kanji_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`kanji_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`kanji_id`) REFERENCES `kanjis`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `kanjis` (
	`id` text PRIMARY KEY NOT NULL,
	`character` text NOT NULL,
	`meaning` text NOT NULL,
	`onyomi` text,
	`kunyomi` text,
	`jlpt_level` integer,
	`jouyou_grade` integer,
	`frequency_rank` integer,
	`stroke_count` integer,
	`radicals` text,
	`components` text,
	`examples` text,
	`mnemonics` text,
	`stroke_order_diagram` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `kanjis_character_unique` ON `kanjis` (`character`);--> statement-breakpoint
CREATE TABLE `review_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kanji_id` text NOT NULL,
	`review_date` text NOT NULL,
	`quality` integer NOT NULL,
	`elapsed_ms` integer,
	`previous_interval` integer,
	`new_interval` integer,
	`previous_ease_factor` integer,
	`new_ease_factor` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kanji_id`) REFERENCES `kanjis`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `study_decks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_public` integer DEFAULT false,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`deck_id` text,
	`start_time` text NOT NULL,
	`end_time` text,
	`review_count` integer DEFAULT 0,
	`correct_count` integer DEFAULT 0,
	`study_mode` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deck_id`) REFERENCES `study_decks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#3b82f6',
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `user_kanji_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kanji_id` text NOT NULL,
	`interval` integer DEFAULT 0,
	`ease_factor` integer DEFAULT 250,
	`due_date` text NOT NULL,
	`review_count` integer DEFAULT 0,
	`correct_count` integer DEFAULT 0,
	`incorrect_count` integer DEFAULT 0,
	`last_review_date` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`user_notes` text,
	`user_mnemonic` text,
	`user_difficulty` integer DEFAULT 3,
	`last_review_quality` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kanji_id`) REFERENCES `kanjis`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_login` text,
	`preferences` text DEFAULT '{"theme":"system","furiganaPosition":"above","fontSize":"medium","studyGoalDaily":20}',
	`streak` integer DEFAULT 0,
	`last_study_date` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);