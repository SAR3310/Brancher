// Kumpulan ikon SVG konsisten (tidak bergantung font emoji perangkat)
const I = (path, extra = {}) => (props) => (
  <svg viewBox="0 0 24 24" width={props.size || 16} height={props.size || 16} fill="currentColor" {...extra}>
    <path d={path} />
  </svg>
);

export const IconLogout = I("M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9Z");
export const IconPin = I("M16 12V4h1a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2Z");
export const IconAttach = I("M16.5 6v11.5a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10.5a1 1 0 0 1-2 0V6H10v9.5a2.5 2.5 0 0 0 5 0V5a4 4 0 0 0-8 0v12.5a5.5 5.5 0 0 0 11 0V6h-1.5Z");
export const IconSend = I("M2 21 23 12 2 3v7l15 2-15 2v7Z");
export const IconSmile = I("M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM8.5 11A1.5 1.5 0 1 0 8.5 8a1.5 1.5 0 0 0 0 3Zm7 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-8.2 3a5 5 0 0 0 9.4 0H7.3Z");
export const IconReply = I("M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11Z");
export const IconEdit = I("M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7a1 1 0 0 0 0-1.4L18.4 3.3a1 1 0 0 0-1.4 0l-1.83 1.83 3.75 3.75L20.7 7Z");
export const IconTrash = I("M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z");
export const IconPlus = I("M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z");
export const IconClose = I("M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4Z");
export const IconHash = I("M10 3 8.8 9H4v2h4.4l-.8 4H4v2h3.2L6 23h2l1.2-6h4.6L12.6 23h2l1.2-6H20v-2h-3.8l.8-4H20V9h-2.6L18.6 3h-2l-1.2 6H10.8L12 3h-2Zm.4 8h4.6l-.8 4H9.6l.8-4Z");
export const IconSpeaker = I("M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4Zm-2.5-8.8v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6Z");
export const IconMegaphone = I("M12 8H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1v4h2v-4h5l8 4V4l-8 4Zm8 8.6-6-3V10.4l6-3v9.2Z");
export const IconPeople = I("M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13Zm8 0h-1a5.4 5.4 0 0 1 2 4v2h6v-2.5c0-2.3-4.7-3.5-7-3.5Z");
export const IconLink = I("M3.9 12a3.6 3.6 0 0 1 3.6-3.6h4V6.5h-4a5.5 5.5 0 0 0 0 11h4v-1.9h-4A3.6 3.6 0 0 1 3.9 12Zm4.6 1h7v-2h-7v2Zm8-6.5h-4v1.9h4a3.6 3.6 0 0 1 0 7.2h-4v1.9h4a5.5 5.5 0 0 0 0-11Z");
export const IconSearch = I("M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5Zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z");
export const IconLeave = I("M5 3h8a2 2 0 0 1 2 2v4h-2V5H5v14h8v-4h2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm11.5 4.5L15 9l3 3-3 3 1.5 1.5L21 12l-4.5-4.5Z");
export const IconCheck = I("M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z");
