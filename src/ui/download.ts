/** Dispara la descarga de un texto como archivo. */
export function downloadText(
  filename: string,
  text: string,
  mime = 'application/json',
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  // Libera la memoria del blob. Va DESPUÉS del clic, y con un respiro: en
  // algunos navegadores la descarga arranca un instante después del click() y,
  // si el enlace ya no existe, baja un archivo vacío.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Convierte "Brazo Antropomórfico 3R" en "brazo-antropomorfico-3r". */
export function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')                      // separa letras de sus tildes
      .replace(/[̀-ͯ]/g, '')       // borra las tildes sueltas
      .replace(/[^a-z0-9]+/g, '-')           // todo lo demás, a guiones
      .slice(0, 50)                          // nombres de archivo cortos
      .replace(/^-+|-+$/g, '')               // sin guiones al inicio ni al final
    || 'brazo'
  );
}
