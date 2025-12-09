/// <reference lib="webworker" />

import JSZip from 'jszip';

addEventListener('message', ({ data }) => {
  const files: File[] = data.files;
  const zip = new JSZip();

  // Add files to zip
  files.forEach(file => {
    zip.file(file.name, file);
  });

  // Generate zip with progress
  zip.generateAsync({ type: 'blob' }, (metadata) => {
    postMessage({
      type: 'progress',
      value: Math.round(metadata.percent)
    });
  }).then((blob) => {
    postMessage({
      type: 'complete',
      blob: blob
    });
  });
});
