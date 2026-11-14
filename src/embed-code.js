const button = document.getElementById('copy-embed');
const code = document.getElementById('embed-code');
const status = document.getElementById('copy-status');
button.addEventListener('click', async () => {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(code.value);
    else {
      code.select();
      if (!document.execCommand('copy')) throw Error('Copy unavailable');
    }
    status.textContent = 'Embed code copied.';
    button.focus();
  } catch {
    code.focus();
    code.select();
    status.textContent = 'Select and copy the HTML snippet.';
  }
});
