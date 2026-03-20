/**
 * Masks an email address for display, e.g.:
 *   example@gmail.com  →  ex***le@gmail.com
 *   ab@gmail.com       →  a***@gmail.com
 *   abcd@gmail.com     →  a***d@gmail.com
 */
export function maskEmail(email: string): string {
    const atIdx = email.indexOf("@");
    if (atIdx < 0) return email;

    const local = email.slice(0, atIdx);
    const domain = email.slice(atIdx); // includes "@"

    if (local.length <= 2) return local[0] + "***" + domain;
    if (local.length <= 4) return local[0] + "***" + local.slice(-1) + domain;
    return local.slice(0, 2) + "***" + local.slice(-2) + domain;
}

/**
 * Validates and cleans an image URL
 * Returns the URL if valid, null otherwise
 * Removes zero-width spaces and other invisible characters
 */
export function validateImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    
    // Remove zero-width spaces and trim
    const cleaned = url.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    
    // Check if it's a valid HTTP/HTTPS URL
    if (cleaned && (cleaned.startsWith('http://') || cleaned.startsWith('https://'))) {
        return cleaned;
    }
    
    return null;
}
