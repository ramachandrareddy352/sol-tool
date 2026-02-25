import tokens from "../top2000_solana_coins.json";

const normalize = (value) => value.trim().toLowerCase();

export function isNameRestricted(inputName) {
  const cleanInput = normalize(inputName);

  if (!cleanInput) return false;

  return tokens.some((token) => normalize(token.name) === cleanInput);
}

export function isSymbolRestricted(inputSymbol) {
  const cleanInput = normalize(inputSymbol);

  if (!cleanInput) return false;

  return tokens.some((token) => normalize(token.symbol) === cleanInput);
}
