export function getPublicWardrobeDisplayState(
  totalItemCount: number,
  filteredItemCount: number,
) {
  return {
    hasAnyWardrobeItems: totalItemCount > 0,
    hasFilteredItems: filteredItemCount > 0,
  };
}
