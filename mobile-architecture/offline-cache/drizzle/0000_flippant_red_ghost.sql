CREATE TABLE `outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_attempt_at` integer,
	`last_error` text,
	`status` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `outbox_entity_idx` ON `outbox` (`entity_id`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author` text NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`image_url` text NOT NULL,
	`thumb_url` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`likes_count` integer DEFAULT 0 NOT NULL,
	`liked_by_me` integer DEFAULT false NOT NULL,
	`cached_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `posts_feed_idx` ON `posts` (`deleted_at`,`cached_at`,`created_at`);--> statement-breakpoint
CREATE TABLE `sync_state` (
	`key` text PRIMARY KEY NOT NULL,
	`cursor` text,
	`last_success_at` text
);
