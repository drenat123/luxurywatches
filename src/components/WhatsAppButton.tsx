export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/38343737210"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Na shkruani në WhatsApp: +383 43 737 210 (hapet në dritare të re)"
      title="Na shkruani në WhatsApp"
      className="fixed z-40 right-4 sm:right-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white border-2 border-white shadow-lg hover:bg-[#1ebe5d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#128C7E] transition-colors"
      style={{ bottom: 'calc(128px + env(safe-area-inset-bottom, 0px))' }}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M20.52 3.48A11.91 11.91 0 0 0 12.04 0C5.46 0 .1 5.35.1 11.94c0 2.1.55 4.15 1.6 5.96L0 24l6.25-1.64a11.93 11.93 0 0 0 5.79 1.48h.01C18.63 23.84 24 18.49 24 11.9a11.87 11.87 0 0 0-3.48-8.42ZM12.05 21.83a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.71.97.99-3.62-.24-.37a9.87 9.87 0 0 1-1.52-5.28c0-5.47 4.45-9.92 9.93-9.92a9.86 9.86 0 0 1 7.02 2.91 9.85 9.85 0 0 1 2.91 7.02c0 5.47-4.45 9.92-9.97 9.88Zm5.44-7.43c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.11 3.22 5.12 4.52.71.3 1.27.48 1.7.62.72.23 1.37.2 1.88.12.58-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}
