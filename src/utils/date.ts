
// Convierte Date → 'YYYY-MM-DD' en LOCAL (no UTC)
const toYMD = (d: Date) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

// Convierte 'YYYY-MM-DD' → Date “seguro” (ancla a mediodía para evitar saltos)
const parseYMD = (ymd: string) => new Date(`${ymd}T12:00:00`);

export { toYMD, parseYMD };