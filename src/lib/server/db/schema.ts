import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';

// User table with extended information for the Kanji learning application
export const users = sqliteTable('users', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	username: text('username').notNull().unique(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
	lastLogin: text('last_login'),
	preferences: text('preferences', { mode: 'json' }).$type<{
		theme: 'light' | 'dark' | 'system';
		furiganaPosition: 'above' | 'inline';
		fontSize: string;
		studyGoalDaily: number;
	}>().default({
		theme: 'system',
		furiganaPosition: 'above',
		fontSize: 'medium',
		studyGoalDaily: 20
	}),
	streak: integer('streak').default(0),
	lastStudyDate: text('last_study_date')
});

// Kanji table to store all kanji information
export const kanjis = sqliteTable('kanjis', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	character: text('character').notNull().unique(),
	meaning: text('meaning').notNull(),
	onyomi: text('onyomi'),
	kunyomi: text('kunyomi'),
	jlptLevel: integer('jlpt_level'),
	jouyouGrade: integer('jouyou_grade'),
	frequencyRank: integer('frequency_rank'),
	strokeCount: integer('stroke_count'),
	radicals: text('radicals'),
	components: text('components', { mode: 'json' }).$type<string[]>(),
	examples: text('examples', { mode: 'json' }).$type<Array<{
		word: string;
		reading: string;
		meaning: string;
	}>>(),
	mnemonics: text('mnemonics'),
	strokeOrderDiagram: text('stroke_order_diagram'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// Study progress for users
export const userKanjiProgress = sqliteTable('user_kanji_progress', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	kanjiId: text('kanji_id').notNull().references(() => kanjis.id, { onDelete: 'cascade' }),
	interval: integer('interval').default(0), // days until next review
	easeFactor: integer('ease_factor').default(250), // multiplier for interval (250 = 2.5)
	dueDate: text('due_date').notNull().$defaultFn(() => new Date().toISOString()), // when to review next
	reviewCount: integer('review_count').default(0),
	correctCount: integer('correct_count').default(0),
	incorrectCount: integer('incorrect_count').default(0),
	lastReviewDate: text('last_review_date').notNull().$defaultFn(() => new Date().toISOString()),
	status: text('status').notNull().default('new'), // new, learning, reviewing, burned
	userNotes: text('user_notes'),
	userMnemonic: text('user_mnemonic'),
	userDifficulty: integer('user_difficulty').default(3), // 1-5 scale
	lastReviewQuality: integer('last_review_quality'), // 0-5 scale from SM-2 algorithm
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// Review history to track all reviews
export const reviewHistory = sqliteTable('review_history', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	kanjiId: text('kanji_id').notNull().references(() => kanjis.id, { onDelete: 'cascade' }),
	reviewDate: text('review_date').notNull().$defaultFn(() => new Date().toISOString()),
	quality: integer('quality').notNull(), // 0-5 scale from SM-2 algorithm
	elapsedMs: integer('elapsed_ms'), // How long the review took
	previousInterval: integer('previous_interval'),
	newInterval: integer('new_interval'),
	previousEaseFactor: integer('previous_ease_factor'),
	newEaseFactor: integer('new_ease_factor')
});

// Study decks
export const studyDecks = sqliteTable('study_decks', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	isPublic: integer('is_public', { mode: 'boolean' }).default(false),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// Many-to-many relationship between decks and kanji
export const deckKanjis = sqliteTable('deck_kanjis', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	deckId: text('deck_id').notNull().references(() => studyDecks.id, { onDelete: 'cascade' }),
	kanjiId: text('kanji_id').notNull().references(() => kanjis.id, { onDelete: 'cascade' }),
	position: integer('position').default(0), // For custom ordering
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

// User study sessions
export const studySessions = sqliteTable('study_sessions', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	deckId: text('deck_id').references(() => studyDecks.id, { onDelete: 'set null' }),
	startTime: text('start_time').notNull().$defaultFn(() => new Date().toISOString()),
	endTime: text('end_time'),
	reviewCount: integer('review_count').default(0),
	correctCount: integer('correct_count').default(0),
	studyMode: text('study_mode').notNull() // 'kanji-to-meaning', 'meaning-to-kanji', etc.
});

// Tags for organizing kanji
export const tags = sqliteTable('tags', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	name: text('name').notNull().unique(),
	description: text('description'),
	color: text('color').default('#3b82f6'), // Default blue
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

// Many-to-many relationship between kanji and tags
export const kanjiTags = sqliteTable('kanji_tags', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	kanjiId: text('kanji_id').notNull().references(() => kanjis.id, { onDelete: 'cascade' }),
	tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});
