// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { AuthUser } from '$lib/server/auth';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: AuthUser | null;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
