import { useEffect } from "react";

const PixelScripts = () => {
  useEffect(() => {
    const fbPixelId = import.meta.env.VITE_FB_PIXEL_ID;
    const utmifyPixelId = import.meta.env.VITE_UTMIFY_PIXEL_ID;

    // Facebook Pixel
    if (fbPixelId) {
      const fbScript = document.createElement("script");
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${fbPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);

      // noscript fallback
      const noscript = document.createElement("noscript");
      const img = document.createElement("img");
      img.height = 1;
      img.width = 1;
      img.style.display = "none";
      img.src = `https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`;
      noscript.appendChild(img);
      document.body.appendChild(noscript);
    }

    // Utmify Pixel
    if (utmifyPixelId) {
      const utmifyScript = document.createElement("script");
      utmifyScript.innerHTML = `window.pixelId = "${utmifyPixelId}";`;
      document.head.appendChild(utmifyScript);

      const utmifyLoader = document.createElement("script");
      utmifyLoader.async = true;
      utmifyLoader.defer = true;
      utmifyLoader.src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";
      document.head.appendChild(utmifyLoader);
    }

    // Utmify Capture Script (fixo)
    const captureScript = document.createElement("script");
    captureScript.src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
    captureScript.async = true;
    captureScript.defer = true;
    captureScript.setAttribute("data-utmify-prevent-xcod-sck", "");
    captureScript.setAttribute("data-utmify-prevent-subids", "");
    document.head.appendChild(captureScript);
  }, []);

  return null;
};

export default PixelScripts;
