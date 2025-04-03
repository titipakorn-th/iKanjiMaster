import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url: './data/db.sqlite',
	},
	out: './drizzle',
	verbose: true,
	strict: true,
});
