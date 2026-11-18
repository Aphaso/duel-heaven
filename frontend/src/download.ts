/** Makes the browser save a file that we have in memory. */
export function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // The browser needs a moment to start the download before the address can be released
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}