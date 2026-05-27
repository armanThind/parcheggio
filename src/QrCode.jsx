// Utility React component to generate a QR code from a string (e.g. prenotazione id)
import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QrCode({ value, size = 160, downloadName }) {
  const ref = useRef();

  // Funzione per scaricare il QR code come PNG
  function handleDownload() {
    if (!ref.current) return;
    const svg = ref.current.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const img = new window.Image();
    const svg64 = btoa(unescape(encodeURIComponent(source)));
    const image64 = 'data:image/svg+xml;base64,' + svg64;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (downloadName || 'qrcode') + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = image64;
  }

  if (!value) return null;
  return (
    <span ref={ref} style={{cursor: downloadName ? 'pointer' : 'default'}} onClick={downloadName ? handleDownload : undefined} title={downloadName ? 'Scarica QR code' : ''}>
      <QRCodeSVG value={value} size={size} />
    </span>
  );
}
