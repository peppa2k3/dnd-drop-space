const utf8 = new TextDecoder('utf-8', { fatal: true });

// Multipart filename parameters arrive as latin1 bytes from Multer/Busboy.
// Leave already-decoded Unicode and genuine latin1 names unchanged.
function decodeFileName(name) {
  if (Array.from(name).some((char) => char.codePointAt(0) > 255)) return name;
  try {
    return utf8.decode(Buffer.from(name, 'latin1'));
  } catch {
    return name;
  }
}

module.exports = decodeFileName;
