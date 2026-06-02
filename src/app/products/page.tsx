"use client";

import { useFetch } from "@/hooks/useFetch";
import { productsApi, bomApi, inventoryApi } from "@/lib/api";
import type { Product, BOMEntry, InventoryItem } from "@/types/mytypes";

// ─── Availability computation ─────────────────────────────────────────────────
// A product is Available only when ALL of its BOM ingredients
// have inv_stock > 0 (strictly above zero — no partial)
function computeAvailability(
  productId: number,
  allBom: BOMEntry[],
  inventoryMap: Map<number, InventoryItem>
): { available: boolean; missingIngredients: string[] } {
  // Filter BOM entries that belong to this product
  const entries = allBom.filter((b) => b.prod_id === productId);

  if (entries.length === 0) {
    // No BOM defined — cannot determine availability; treat as unavailable
    return { available: false, missingIngredients: ["No BOM configured"] };
  }

  const missingIngredients: string[] = [];

  for (const entry of entries) {
    const invItem = inventoryMap.get(entry.inv_id);
    const required = entry.bom_quan_req ?? (entry as any).bom_quantity ?? 0;

    if (!invItem) {
      missingIngredients.push(`Ingredient #${entry.inv_id} (not found)`);
      continue;
    }

    if ((invItem.inv_stock ?? 0) < required) {
      missingIngredients.push(
        `${invItem.inv_ing_name} (need ${required} ${invItem.inv_uom}, have ${invItem.inv_stock})`
      );
    }
  }

  return {
    available: missingIngredients.length === 0,
    missingIngredients,
  };
}

export default function ProductsPage() {
  const { data: products, loading: loadingProducts } = useFetch<Product[]>(productsApi.list);
  const { data: allBom, loading: loadingBom } = useFetch<BOMEntry[]>(bomApi.list);
  const { data: inventory, loading: loadingInv } = useFetch<InventoryItem[]>(inventoryApi.list);

  const loading = loadingProducts || loadingBom || loadingInv;

  // Build a fast lookup map: inv_id → InventoryItem
  const inventoryMap = new Map<number, InventoryItem>(
    (inventory ?? []).map((i) => [i.inv_id, i])
  );

  return (
    <div style={containerStyle}>
      <div style={backgroundWrapperStyle} />
      <div style={luxuryScrimOverlayStyle} />

      <div style={contentWrapperStyle}>
        {/* Header */}
        <div style={headerContainerStyle}>
          <div>
            <h1 style={titleStyle}>Cookie Catalog</h1>
            <p style={subtitleStyle}>
              {products?.length ?? 0} products · availability based on live inventory
            </p>
          </div>
        </div>

        {loading && <div style={statusMessageStyle}>Loading product availability...</div>}

        {!loading && (
          <div style={gridStyle}>
            {(products ?? []).map((product) => {
              const productId = product.prod_id ?? (product as any).id;
              const { available, missingIngredients } = computeAvailability(
                productId,
                allBom ?? [],
                inventoryMap
              );

              // Get BOM entries for display
              const bomEntries = (allBom ?? []).filter((b) => b.prod_id === productId);

              return (
                <div key={productId} style={cardStyle}>
                  {/* Availability badge — top right */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <span style={productIdStyle}>ID: {productId}</span>
                    <span style={available ? availableBadgeStyle : unavailableBadgeStyle}>
                      {available ? "✓ Available" : "✗ Unavailable"}
                    </span>
                  </div>

                  {/* Product name */}
                  <h3 style={productNameStyle}>
                    {(product as any).prod_name ?? (product as any).name ?? `Product #${productId}`}
                  </h3>

                  {/* Price if exists */}
                  {(product as any).prod_price != null && (
                    <p style={priceStyle}>₱{Number((product as any).prod_price).toLocaleString()}</p>
                  )}

                  {/* Description if exists */}
                  {(product as any).prod_description && (
                    <p style={descStyle}>{(product as any).prod_description}</p>
                  )}

                  {/* Ingredient requirements from BOM */}
                  {bomEntries.length > 0 && (
                    <div style={ingredientsSection}>
                      <p style={ingredientsTitleStyle}>Ingredients required:</p>
                      <ul style={ingredientsListStyle}>
                        {bomEntries.map((entry) => {
                          const invItem = inventoryMap.get(entry.inv_id);
                          const required = entry.bom_quan_req ?? (entry as any).bom_quantity ?? 0;
                          const hasStock = invItem && (invItem.inv_stock ?? 0) >= required;
                          return (
                            <li key={entry.inv_id} style={{ ...ingredientItemStyle, color: hasStock ? "#bbf7d0" : "#fca5a5" }}>
                              <span style={{ color: hasStock ? "#bbf7d0" : "#fca5a5", marginRight: "4px" }}>
                                {hasStock ? "●" : "○"}
                              </span>
                              {invItem?.inv_ing_name ?? `Ingredient #${entry.inv_id}`}
                              {" — "}
                              <span style={{ color: "#94a3b8" }}>
                                need {required} {invItem?.inv_uom ?? ""}
                                {invItem && (
                                  <>, have{" "}
                                    <strong style={{ color: hasStock ? "#bbf7d0" : "#fca5a5" }}>
                                      {invItem.inv_stock} {invItem.inv_uom}
                                    </strong>
                                  </>
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* No BOM warning */}
                  {bomEntries.length === 0 && (
                    <div style={noBomStyle}>No BOM configured for this product.</div>
                  )}

                  {/* Bottom availability bar */}
                  <div style={{
                    ...availabilityBarStyle,
                    backgroundColor: available
                      ? "rgba(187,247,208,0.08)"
                      : "rgba(252,165,165,0.08)",
                    borderTop: `1px solid ${available ? "rgba(187,247,208,0.15)" : "rgba(252,165,165,0.15)"}`,
                  }}>
                    {available ? (
                      <span style={{ color: "#bbf7d0", fontSize: "11px" }}>
                        All ingredients in stock — ready to bake
                      </span>
                    ) : (
                      <span style={{ color: "#fca5a5", fontSize: "11px" }}>
                        Insufficient stock: {missingIngredients.slice(0, 2).join("; ")}
                        {missingIngredients.length > 2 && ` +${missingIngredients.length - 2} more`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {(products ?? []).length === 0 && (
              <div style={emptyStateStyle}>No products found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = { position: "relative", minHeight: "calc(100vh - var(--navbar-h, 60px))", overflowY: "auto", padding: "24px 32px", backgroundColor: "#080605", fontFamily: "system-ui, -apple-system, sans-serif", color: "#FFFFFF" };
const backgroundWrapperStyle: React.CSSProperties = { position: "fixed", top: "var(--navbar-h, 60px)", left: 0, right: 0, bottom: 0, backgroundImage: "url('/Products-bg.png')", backgroundSize: "cover", backgroundPosition: "center", opacity: 1, zIndex: 0, pointerEvents: "none" };
const luxuryScrimOverlayStyle: React.CSSProperties = { position: "fixed", top: "var(--navbar-h, 60px)", left: 0, right: 0, bottom: 0, backgroundColor: "rgba(8,6,5,0.7)", zIndex: 1, pointerEvents: "none" };
const contentWrapperStyle: React.CSSProperties = { position: "relative", zIndex: 2, maxWidth: "1340px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" };
const headerContainerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "26px", fontWeight: "normal", fontFamily: "Georgia, serif", color: "#FFFFFF" };
const subtitleStyle: React.CSSProperties = { margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" };
const cardStyle: React.CSSProperties = { backgroundColor: "rgba(20,18,16,0.82)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "20px", display: "flex", flexDirection: "column", gap: "0", boxShadow: "0 15px 30px rgba(0,0,0,0.3)", overflow: "hidden" };
const productIdStyle: React.CSSProperties = { fontSize: "10px", color: "#64748b", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" };
const availableBadgeStyle: React.CSSProperties = { backgroundColor: "rgba(220,252,231,0.12)", color: "#bbf7d0", border: "1px solid #bbf7d022", padding: "3px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" };
const unavailableBadgeStyle: React.CSSProperties = { backgroundColor: "rgba(254,226,226,0.12)", color: "#fca5a5", border: "1px solid #fca5a522", padding: "3px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" };
const productNameStyle: React.CSSProperties = { margin: "0 0 4px 0", fontSize: "17px", fontWeight: "normal", fontFamily: "Georgia, serif", color: "#FFFFFF" };
const priceStyle: React.CSSProperties = { margin: "0 0 6px 0", fontSize: "14px", color: "#C8883A", fontWeight: 600 };
const descStyle: React.CSSProperties = { margin: "0 0 12px 0", fontSize: "12px", color: "#64748b", lineHeight: "1.5" };
const ingredientsSection: React.CSSProperties = { marginTop: "12px", marginBottom: "12px" };
const ingredientsTitleStyle: React.CSSProperties = { margin: "0 0 6px 0", fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" };
const ingredientsListStyle: React.CSSProperties = { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" };
const ingredientItemStyle: React.CSSProperties = { fontSize: "12px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2px" };
const noBomStyle: React.CSSProperties = { marginTop: "10px", fontSize: "11px", color: "#64748b", fontStyle: "italic" };
const availabilityBarStyle: React.CSSProperties = { marginTop: "14px",
marginRight: "auto",
marginBottom: "auto",
marginLeft: "auto", paddingTop: "10px", padding: "10px 12px", borderRadius: "4px" };
const statusMessageStyle: React.CSSProperties = { textAlign: "center", padding: "32px 16px", fontSize: "13px", color: "#64748b" };
const emptyStateStyle: React.CSSProperties = { padding: "40px", textAlign: "center", color: "#64748b", fontSize: "13px", fontStyle: "italic", gridColumn: "1 / -1" };