"use client";

import { useState, useRef } from "react";
import { useFetch } from "@/hooks/useFetch";
import { productsApi, bomApi, inventoryApi } from "@/lib/api";
import type { Product, BOMEntry, InventoryItem } from "@/types/mytypes";

// ─── BOM Form Modal ───────────────────────────────────────────────────────────
function BOMForm({
  productId,
  inventory,
  existingEntries,
  onClose,
  onSaved,
}: {
  productId: number;
  inventory: InventoryItem[];
  existingEntries: BOMEntry[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selectedInvId, setSelectedInvId] = useState<number | "">("");
  const [quantityReq, setQuantityReq] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const selectedItem = inventory.find((i) => i.inv_id === Number(selectedInvId));

  const handleSave = async () => {
    if (!selectedInvId || quantityReq <= 0) {
      alert("Please select an ingredient and enter a valid quantity.");
      return;
    }
    setSaving(true);
    try {
      await bomApi.create({
        prod_id: productId,
        inv_id: Number(selectedInvId),
        bom_quan_req: quantityReq,
      });
      onSaved();
      // Reset for adding another
      setSelectedInvId("");
      setQuantityReq(0);
    } catch (err: any) {
      let msg = "Unknown error";
      try {
        if (typeof err === "string") msg = err;
        else if (err instanceof Error) msg = err.message;
        else {
          const detail = err?.detail ?? err?.message ?? err?.error;
          msg = detail !== undefined
            ? (typeof detail === "string" ? detail : JSON.stringify(detail))
            : JSON.stringify(err, Object.getOwnPropertyNames(err));
        }
      } catch { msg = String(err); }
      alert(`Failed to save BOM entry:\n${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bomId: number) => {
    if (!confirm("Remove this ingredient from the BOM?")) return;
    try {
      await bomApi.delete(bomId);
      onSaved();
    } catch (err: any) {
      alert(`Failed to delete BOM entry: ${err?.message ?? err}`);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={{ ...modalStyle, maxWidth: "520px" }}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>BOM — Product #{productId}</h2>
          <button style={modalCloseBtnStyle} onClick={onClose}>✕</button>
        </div>

        {/* Existing entries */}
        {existingEntries.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <p style={sectionLabelStyle}>Current ingredients</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {existingEntries.map((entry) => {
                const invItem = inventory.find((i) => i.inv_id === entry.inv_id);
                return (
                  <div key={entry.inv_id} style={bomRowStyle}>
                    <span style={{ color: "#FFFFFF", fontSize: "13px" }}>
                      {invItem?.inv_ing_name ?? `Ingredient #${entry.inv_id}`}
                    </span>
                    <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                      {entry.bom_quan_req} {invItem?.inv_uom ?? ""}
                    </span>
                    <button
                      style={deleteBtnStyle}
                      onClick={() => handleDelete(entry.bom_id)}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p style={sectionLabelStyle}>Add ingredient</p>

        {/* Ingredient dropdown */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Ingredient</label>
          <select
            style={inputStyle}
            value={selectedInvId}
            onChange={(e) => {
              setSelectedInvId(e.target.value === "" ? "" : Number(e.target.value));
              setQuantityReq(0);
            }}
          >
            <option value="" style={{ background: "#141210", color: "#64748b" }}>
              Select an ingredient…
            </option>
            {inventory.map((item) => (
              <option
                key={item.inv_id}
                value={item.inv_id}
                style={{ background: "#141210", color: "#fff" }}
              >
                {item.inv_ing_name}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity + Unit (auto from inventory) */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ ...fieldGroupStyle, flex: 2 }}>
            <label style={labelStyle}>Quantity required</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              step={0.01}
              value={quantityReq}
              onChange={(e) => setQuantityReq(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div style={{ ...fieldGroupStyle, flex: 1 }}>
            <label style={labelStyle}>Unit</label>
            <input
              style={{ ...inputStyle, backgroundColor: "rgba(8,6,5,0.4)", color: "#64748b" }}
              value={selectedItem?.inv_uom ?? "—"}
              readOnly
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button style={cancelBtnStyle} onClick={onClose} disabled={saving}>Done</button>
          <button
            style={{
              ...saveBtnStyle,
              opacity: !selectedInvId || quantityReq <= 0 ? 0.5 : 1,
              cursor: !selectedInvId || quantityReq <= 0 ? "not-allowed" : "pointer",
            }}
            onClick={handleSave}
            disabled={saving || !selectedInvId || quantityReq <= 0}
          >
            {saving ? "Saving…" : "Add to BOM"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Form Modal ───────────────────────────────────────────────────────
function ProductForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = initial !== null;

  const [name, setName] = useState(initial?.prod_name ?? "");
  const [price, setPrice] = useState<number>(initial?.prod_price ?? 0);
  const [desc, setDesc] = useState(initial?.prod_desc ?? "");
  const [sl, setSl] = useState(initial?.prod_sl ?? "");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.prod_image_url ?? null);
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadProgress("idle");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let uploadedImageUrl: string | undefined;
      if (imageFile) {
        setUploadProgress("uploading");
        try {
          // TODO: Replace with actual Supabase upload logic
          // const { data, error } = await supabase.storage.from('products').upload(...)
          // uploadedImageUrl = supabase.storage.from('products').getPublicUrl(...).data.publicUrl
          setUploadProgress("done");
        } catch (uploadErr: any) {
          setUploadProgress("error");
          alert(`Image upload failed: ${uploadErr?.message ?? "Unknown error"}`);
          setSaving(false);
          return;
        }
      }

      const payload = {
        prod_name: name,
        prod_price: price,
        prod_desc: desc,
        prod_sl: sl,
        // prod_available is NOT sent — backend auto-computes it on GET /products
        ...(uploadedImageUrl ? { prod_image_url: uploadedImageUrl } : {}),
      };

      if (isEditing && initial) {
        await productsApi.update(initial.prod_id, payload);
      } else {
        await productsApi.create(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      let msg: string;
      try {
        if (typeof err === "string") msg = err;
        else if (err instanceof Error) msg = err.message;
        else {
          const detail = err?.detail ?? err?.message ?? err?.error ?? err?.statusText;
          msg = detail !== undefined
            ? (typeof detail === "string" ? detail : JSON.stringify(detail))
            : JSON.stringify(err, Object.getOwnPropertyNames(err)) ?? String(err);
        }
      } catch { try { msg = String(err); } catch { msg = "Unserializable error"; } }
      alert(`Failed to save product:\n${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>{isEditing ? "Edit Product" : "New Product"}</h2>
          <button style={modalCloseBtnStyle} onClick={onClose}>✕</button>
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Product Name</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Choco Chip Cookie" />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Price (₱)</label>
          <input style={inputStyle} type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "72px" }} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short product description…" />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Shelf Life</label>
          <input style={inputStyle} value={sl} onChange={(e) => setSl(e.target.value)} placeholder="e.g. 3 days" />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Product Image (optional)</label>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImagePick} />
          <div style={imageDropZoneStyle} onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? (
              <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }} />
            ) : (
              <div style={imageDropPlaceholderStyle}>
                <span style={{ fontSize: "22px", opacity: 0.5 }}>📷</span>
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>Click to upload image</span>
              </div>
            )}
          </div>
          {uploadProgress === "uploading" && <p style={{ fontSize: "11px", color: "#fde68a", marginTop: "4px" }}>Uploading…</p>}
          {uploadProgress === "done"      && <p style={{ fontSize: "11px", color: "#bbf7d0", marginTop: "4px" }}>✓ Image uploaded successfully</p>}
          {uploadProgress === "error"     && <p style={{ fontSize: "11px", color: "#fca5a5", marginTop: "4px" }}>✗ Upload failed — check Supabase credentials &amp; bucket policy</p>}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button style={cancelBtnStyle} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  // productsApi.list hits GET /products which auto-recomputes prod_available on the backend
  const { data: products, loading: loadingProducts, refetch } = useFetch<Product[]>(productsApi.list);
  const { data: allBom,   loading: loadingBom,   refetch: refetchBom } = useFetch<BOMEntry[]>(bomApi.list);
  const { data: inventory, loading: loadingInv }                        = useFetch<InventoryItem[]>(inventoryApi.list);

  const loading = loadingProducts || loadingBom || loadingInv;

  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Product | null>(null);
  const [bomProduct, setBomProduct] = useState<Product | null>(null);

  const inventoryMap = new Map<number, InventoryItem>(
    (inventory ?? []).map((i) => [i.inv_id, i])
  );

  const handleBomSaved = () => {
    refetchBom();
    // Refetch products so prod_available badge reflects latest BOM change
    refetch();
  };

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
              {products?.length ?? 0} products · availability auto-computed from live inventory
            </p>
          </div>
          <button style={primaryBtnStyle} onClick={() => { setEditing(null); setShowForm(true); }}>
            + Add Product
          </button>
        </div>

        {loading && <div style={statusMessageStyle}>Loading product availability...</div>}

        {!loading && (
          <div style={gridStyle}>
            {(products ?? []).map((product) => {
              const productId = product.prod_id ?? (product as any).id;
              const bomEntries = (allBom ?? []).filter((b) => b.prod_id === productId);

              // Use backend-computed prod_available as source of truth
              const available = product.prod_available ?? false;

              // Still show per-ingredient breakdown from frontend for detail view
              const missingIngredients: string[] = [];
              for (const entry of bomEntries) {
                const invItem = inventoryMap.get(entry.inv_id);
                const required = entry.bom_quan_req ?? 0;
                if (!invItem || (invItem.inv_stock ?? 0) < required) {
                  missingIngredients.push(
                    invItem
                      ? `${invItem.inv_ing_name} (need ${required} ${invItem.inv_uom}, have ${invItem.inv_stock})`
                      : `Ingredient #${entry.inv_id} (not found)`
                  );
                }
              }

              return (
                <div key={productId} style={cardStyle}>

                  {/* Top row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <span style={productIdStyle}>ID: {productId}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={available ? availableBadgeStyle : unavailableBadgeStyle}>
                        {available ? "✓ Available" : "✗ Unavailable"}
                      </span>
                      <button style={editBtnStyle} onClick={() => { setBomProduct(product); }}>
                        BOM
                      </button>
                      <button style={editBtnStyle} onClick={() => { setEditing(product); setShowForm(true); }}>
                        Edit
                      </button>
                    </div>
                  </div>

                  {product.prod_image_url && (
                    <img src={product.prod_image_url} alt={product.prod_name} style={productImageStyle} />
                  )}

                  <h3 style={productNameStyle}>
                    {product.prod_name ?? `Product #${productId}`}
                  </h3>

                  {product.prod_price != null && (
                    <p style={priceStyle}>₱{Number(product.prod_price).toLocaleString()}</p>
                  )}

                  {product.prod_desc && (
                    <p style={descStyle}>{product.prod_desc}</p>
                  )}

                  {product.prod_sl && (
                    <p style={shelfLifeStyle}>Shelf life: {product.prod_sl}</p>
                  )}

                  {/* Ingredient breakdown */}
                  {bomEntries.length > 0 && (
                    <div style={ingredientsSection}>
                      <p style={ingredientsTitleStyle}>Ingredients required:</p>
                      <ul style={ingredientsListStyle}>
                        {bomEntries.map((entry) => {
                          const invItem = inventoryMap.get(entry.inv_id);
                          const required = entry.bom_quan_req ?? 0;
                          const hasStock = invItem && (invItem.inv_stock ?? 0) >= required;
                          return (
                            <li key={entry.inv_id} style={{ ...ingredientItemStyle, color: hasStock ? "#bbf7d0" : "#fca5a5" }}>
                              <span style={{ marginRight: "4px" }}>{hasStock ? "●" : "○"}</span>
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

                  {bomEntries.length === 0 && (
                    <div style={noBomStyle}>No BOM configured — click BOM to add ingredients.</div>
                  )}

                  {/* Bottom availability bar */}
                  <div style={{
                    ...availabilityBarStyle,
                    backgroundColor: available ? "rgba(187,247,208,0.08)" : "rgba(252,165,165,0.08)",
                    borderTop: `1px solid ${available ? "rgba(187,247,208,0.15)" : "rgba(252,165,165,0.15)"}`,
                  }}>
                    {available ? (
                      <span style={{ color: "#bbf7d0", fontSize: "11px" }}>All ingredients in stock — ready to bake</span>
                    ) : (
                      <span style={{ color: "#fca5a5", fontSize: "11px" }}>
                        {missingIngredients.length > 0
                          ? `Insufficient stock: ${missingIngredients.slice(0, 2).join("; ")}${missingIngredients.length > 2 ? ` +${missingIngredients.length - 2} more` : ""}`
                          : "Unavailable"}
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

      {showForm && (
        <ProductForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={refetch}
        />
      )}

      {bomProduct && (
        <BOMForm
          productId={bomProduct.prod_id}
          inventory={inventory ?? []}
          existingEntries={(allBom ?? []).filter((b) => b.prod_id === bomProduct.prod_id)}
          onClose={() => setBomProduct(null)}
          onSaved={handleBomSaved}
        />
      )}
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
const primaryBtnStyle: React.CSSProperties = { backgroundColor: "#C8883A", color: "#FFFFFF", padding: "8px 16px", borderRadius: "4px", fontWeight: 600, fontSize: "12px", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(200,136,58,0.15)" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" };
const cardStyle: React.CSSProperties = { backgroundColor: "rgba(20,18,16,0.82)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "20px", display: "flex", flexDirection: "column", gap: "0", boxShadow: "0 15px 30px rgba(0,0,0,0.3)", overflow: "hidden" };
const productIdStyle: React.CSSProperties = { fontSize: "10px", color: "#64748b", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" };
const availableBadgeStyle: React.CSSProperties = { backgroundColor: "rgba(220,252,231,0.12)", color: "#bbf7d0", border: "1px solid #bbf7d022", padding: "3px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" };
const unavailableBadgeStyle: React.CSSProperties = { backgroundColor: "rgba(254,226,226,0.12)", color: "#fca5a5", border: "1px solid #fca5a522", padding: "3px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" };
const editBtnStyle: React.CSSProperties = { backgroundColor: "transparent", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "3px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer" };
const productImageStyle: React.CSSProperties = { width: "100%", height: "160px", objectFit: "cover", borderRadius: "4px", marginBottom: "12px" };
const productNameStyle: React.CSSProperties = { margin: "0 0 4px 0", fontSize: "17px", fontWeight: "normal", fontFamily: "Georgia, serif", color: "#FFFFFF" };
const priceStyle: React.CSSProperties = { margin: "0 0 6px 0", fontSize: "14px", color: "#C8883A", fontWeight: 600 };
const descStyle: React.CSSProperties = { margin: "0 0 6px 0", fontSize: "12px", color: "#64748b", lineHeight: "1.5" };
const shelfLifeStyle: React.CSSProperties = { margin: "0 0 10px 0", fontSize: "11px", color: "#475569" };
const ingredientsSection: React.CSSProperties = { marginTop: "12px", marginBottom: "12px" };
const ingredientsTitleStyle: React.CSSProperties = { margin: "0 0 6px 0", fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" };
const ingredientsListStyle: React.CSSProperties = { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" };
const ingredientItemStyle: React.CSSProperties = { fontSize: "12px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2px" };
const noBomStyle: React.CSSProperties = { marginTop: "10px", fontSize: "11px", color: "#64748b", fontStyle: "italic" };
const availabilityBarStyle: React.CSSProperties = { marginTop: "14px", padding: "10px 12px", borderRadius: "4px" };
const statusMessageStyle: React.CSSProperties = { textAlign: "center", padding: "32px 16px", fontSize: "13px", color: "#64748b" };
const emptyStateStyle: React.CSSProperties = { padding: "40px", textAlign: "center", color: "#64748b", fontSize: "13px", fontStyle: "italic", gridColumn: "1 / -1" };
const sectionLabelStyle: React.CSSProperties = { fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px 0" };
const bomRowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.06)" };
const deleteBtnStyle: React.CSSProperties = { marginLeft: "auto", background: "none", border: "none", color: "#64748b", fontSize: "12px", cursor: "pointer", padding: "2px 6px" };

// Modal styles
const modalOverlayStyle: React.CSSProperties = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" };
const modalStyle: React.CSSProperties = { backgroundColor: "#141210", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "28px", width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 25px 50px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto" };
const modalHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const modalTitleStyle: React.CSSProperties = { margin: 0, fontSize: "18px", fontWeight: "normal", fontFamily: "Georgia, serif", color: "#FFFFFF" };
const modalCloseBtnStyle: React.CSSProperties = { background: "none", border: "none", color: "#64748b", fontSize: "16px", cursor: "pointer", padding: "4px" };
const fieldGroupStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "6px" };
const labelStyle: React.CSSProperties = { fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" };
const inputStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(8,6,5,0.8)", fontSize: "13px", color: "#FFFFFF", outline: "none", width: "100%", boxSizing: "border-box" };
const cancelBtnStyle: React.CSSProperties = { backgroundColor: "transparent", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" };
const saveBtnStyle: React.CSSProperties = { backgroundColor: "#C8883A", color: "#FFFFFF", border: "none", borderRadius: "4px", padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
const imageDropZoneStyle: React.CSSProperties = { width: "100%", height: "100px", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "4px", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,6,5,0.6)" };
const imageDropPlaceholderStyle: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", pointerEvents: "none" };