import { ALLOWED_OFFICIAL_DOMAINS } from '../types.js';
export function verifySource(source) {
    let url;
    try {
        url = new URL(source.url);
    }
    catch {
        return { verified: false, reason: 'Invalid URL format.' };
    }
    if (url.protocol !== 'https:') {
        return { verified: false, reason: 'URL must use HTTPS.' };
    }
    const host = url.hostname.toLowerCase();
    const matches = ALLOWED_OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
    if (!matches) {
        return { verified: false, reason: `Domain "${host}" is not in the allowlist of official sources.` };
    }
    if (!source.title || source.title.trim().length < 3) {
        return { verified: false, reason: 'Source title is missing or too short.' };
    }
    return { verified: true, reason: 'URL is HTTPS and on an allowlisted official domain with a valid title.' };
}
export function verifySources(sources) {
    return sources.map((s) => {
        const { verified, reason } = verifySource(s);
        return { title: s.title, url: s.url, verified, reason };
    });
}
