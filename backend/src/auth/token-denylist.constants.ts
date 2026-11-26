export const TOKEN_DENYLIST_PREFIX = 'auth:denylist:';
/** Holds the token pair issued when a refresh token was spent, for the short grace window (see AuthService.refreshToken). */
export const TOKEN_ROTATION_PREFIX = 'auth:rotation:';
/** Denylist value written when a refresh token is spent by rotation (logout writes '1'). */
export const ROTATED_MARKER = 'rotated';
/**
 * Seconds during which a refresh token that was just rotated returns the SAME new pair again instead of 401. Covers two
 * tabs (sharing one stored session) or a retried request refreshing at the same moment: without it the loser would be
 * rejected and the website would sign the member out of every tab. A token revoked by logout gets no grace.
 */
export const ROTATION_GRACE_SECONDS = 10;
