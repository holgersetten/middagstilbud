// hjelpefunksjon for å normalisere offer-tittel

export const normalizeTitle = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
};