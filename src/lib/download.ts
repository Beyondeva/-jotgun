/**
 * Hand a generated file to the user. On iPhone the share sheet ("บันทึกไปยังไฟล์")
 * is the reliable way to keep a file; elsewhere a normal download is used.
 */
export async function saveFile(content: string, filename: string, type: string): Promise<void> {
  const file = new File([content], filename, { type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return; // the user closed the sheet
      // otherwise fall back to a download
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
