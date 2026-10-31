// Avatars are downloaded at build time (scripts/build-templates.ts) and shipped in the Toy package.
export const avatarPath = (uid: string) => `community/avatars/${uid}.webp`;
