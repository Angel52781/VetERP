import type { AgendaClienteSearch, AgendaClienteSearchResult, AgendaMascotaSearch } from "./types";

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function compactSearchText(value: string | null | undefined) {
  return normalizeSearchText(value).replace(/[^a-z0-9]+/g, "");
}

function valueMatchesQuery(value: string | null | undefined, query: string, compactQuery: string) {
  if (!query) return true;

  const normalizedValue = normalizeSearchText(value);
  const compactValue = compactSearchText(value);

  return normalizedValue.includes(query) || (!!compactQuery && compactValue.includes(compactQuery));
}

function mascotaMatchesQuery(mascota: AgendaMascotaSearch, query: string, compactQuery: string) {
  return (
    valueMatchesQuery(mascota.nombre, query, compactQuery) ||
    valueMatchesQuery(mascota.codigo_text, query, compactQuery)
  );
}

function clienteMatchesQuery(cliente: AgendaClienteSearch, query: string, compactQuery: string) {
  return [
    cliente.nombre,
    cliente.telefono,
    cliente.email,
    cliente.documento,
    cliente.dni,
    cliente.documento_text,
  ].some((value) => valueMatchesQuery(value, query, compactQuery));
}

export function filterClienteSearchResults(
  clientes: AgendaClienteSearch[],
  rawQuery: string,
  limit = 12,
): AgendaClienteSearchResult[] {
  const query = normalizeSearchText(rawQuery);
  const compactQuery = compactSearchText(rawQuery);

  const results = clientes.flatMap((cliente) => {
    const mascotas = cliente.mascotas ?? [];

    if (!query && !compactQuery) {
      return [{ cliente, mascotas, matchingMascotas: [], matchesCliente: true }];
    }

    const matchesCliente = clienteMatchesQuery(cliente, query, compactQuery);
    const matchingMascotas = mascotas.filter((mascota) => mascotaMatchesQuery(mascota, query, compactQuery));

    if (!matchesCliente && matchingMascotas.length === 0) {
      return [];
    }

    return [
      {
        cliente,
        mascotas: matchesCliente ? mascotas : matchingMascotas,
        matchingMascotas,
        matchesCliente,
      },
    ];
  });

  return results.slice(0, limit);
}
