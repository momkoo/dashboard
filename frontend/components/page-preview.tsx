// src/dashboard/frontend/components/page-preview.tsx
'use client';

import React, { useEffect, useRef } from 'react';

interface PagePreviewProps {
  url: string;
  onElementSelect: (elementInfo: any) => void;
}

// Overlay/highlight JS code to inject into the iframe
const OVERLAY_SCRIPT = `
(function() {
  let highlightBox = null;
  document.body.addEventListener('mouseover', function(e) {
    if (highlightBox) highlightBox.remove();
    highlightBox = document.createElement('div');
    highlightBox.style.position = 'absolute';
    highlightBox.style.border = '2px solid red';
    highlightBox.style.pointerEvents = 'none';
    const rect = e.target.getBoundingClientRect();
    highlightBox.style.left = rect.left + window.scrollX + 'px';
    highlightBox.style.top = rect.top + window.scrollY + 'px';
    highlightBox.style.width = rect.width + 'px';
    highlightBox.style.height = rect.height + 'px';
    highlightBox.style.zIndex = 999999;
    document.body.appendChild(highlightBox);
  }, true);

  document.body.addEventListener('mouseout', function(e) {
    if (highlightBox) highlightBox.remove();
    highlightBox = null;
  }, true);

  document.body.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    const info = {
      tag: e.target.tagName,
      id: e.target.id,
      class: e.target.className,
      text: e.target.innerText,
      selector: '', // TODO: Add selector generation if needed
    };
    window.parent.postMessage({ type: 'element-selected', info }, '*');
    if (highlightBox) highlightBox.remove();
    highlightBox = null;
  }, true);
})();
`;

export default function PagePreview({ url, onElementSelect }: PagePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'element-selected') {
        onElementSelect(event.data.info);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementSelect]);

  // Inject overlay/highlight script into iframe after load
  const injectOverlayScript = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const script = iframe.contentDocument!.createElement('script');
      script.textContent = OVERLAY_SCRIPT;
      iframe.contentDocument!.body.appendChild(script);
    } catch (e) {
      // Cross-origin iframes will block script injection
      // In this case, highlight/select will not work (show a warning in parent UI if needed)
    }
  };

  return (
    <iframe
      ref={iframeRef}
      src={url}
      style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}
      onLoad={injectOverlayScript}
      sandbox="allow-scripts allow-same-origin"
      title="Page Preview"
    />
  );
}
