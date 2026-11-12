/** Trim paths down to the root of section they belong to.
 *  Example: /decks/abc123 becomes /decks. / stays /.
 */
export function sectionRoot(pathname: string): string {
    const first = pathname.split('/')[1] ?? '';
    return '/' + first;
}