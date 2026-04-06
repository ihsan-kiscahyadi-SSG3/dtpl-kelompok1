import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOrderHistories, getOrderHistory } from "../../services/api";
import type { OrderHistoryItem } from "../../services/api";
import "./riwayat-pesanan.css";

const FALLBACK_DESTINATION =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop";
const FALLBACK_ACCOMMODATION =
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=600&auto=format&fit=crop";

function formatRupiah(value: string | number) {
  return `Rp. ${Number(value).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatOrderDate(isoDate: string) {
  const d = new Date(isoDate);
  const date = d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}

function statusClass(status: string) {
  const s = status.toLowerCase().replace(/\s/g, "_");
  if (s === "paid" || s.includes("success") || s.includes("completed")) return "paid";
  if (s.includes("failed") || s.includes("cancel")) return "failed";
  if (s === "draft") return "draft";
  return "pending";
}

export default function RiwayatPesananPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailMap, setDetailMap] = useState<Record<number, OrderHistoryItem>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    getOrderHistories()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return orders;
    return orders.filter((order) =>
      order.booking_code.toLowerCase().includes(search) ||
      order.order_item.name.toLowerCase().includes(search)
    );
  }, [keyword, orders]);

  const handleResume = (order: OrderHistoryItem) => {
    if (order.order_item.type === "accommodation") {
      navigate("/penginapan", { state: { resumeOrder: order } });
    } else {
      navigate(`/paket-wisata/${order.order_item.id}`, { state: { resumeOrder: order } });
    }
  };

  const handleContinuePayment = (order: OrderHistoryItem) => {
    if (order.order_item.type === "accommodation") {
      navigate("/penginapan", { state: { openPayment: order } });
    } else {
      navigate(`/paket-wisata/${order.order_item.id}`, { state: { openPayment: order } });
    }
  };

  const handleToggleDetail = async (order: OrderHistoryItem) => {
    if (expandedId === order.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(order.id);
    if (detailMap[order.id]) return;
    setLoadingDetail(true);
    try {
      const detail = await getOrderHistory(order.id);
      setDetailMap((prev) => ({ ...prev, [order.id]: detail }));
    } catch {
      // fall back to list data if detail fetch fails
      setDetailMap((prev) => ({ ...prev, [order.id]: order }));
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <main className="orderHistory">
      <section className="orderHistory__hero">
        <div className="container">
          <h1 className="orderHistory__title">Riwayat Pesanan</h1>

          <div className="orderHistory__searchWrap">
            <span className="orderHistory__searchIcon">⌕</span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="orderHistory__searchInput"
              placeholder="Cari Order ID atau nama destinasi..."
            />
            {keyword && (
              <button
                type="button"
                className="orderHistory__clearBtn"
                onClick={() => setKeyword("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="orderHistory__content">
        <div className="container orderHistory__list">
          {loading ? (
            <div className="orderHistory__empty">Memuat...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="orderHistory__empty">Pesanan tidak ditemukan.</div>
          ) : (
            filteredOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              const detail = detailMap[order.id];

              return (
                <article className="orderHistory__card" key={order.id}>
                  <div className="orderHistory__badgeRow">
                    <span
                      className={`orderHistory__badge orderHistory__badge--${statusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                    {statusClass(order.status) === "draft" && (
                      <button
                        type="button"
                        className="orderHistory__resumeBtn"
                        onClick={() => handleResume(order)}
                      >
                        Lanjutkan Pesanan →
                      </button>
                    )}
                    {statusClass(order.status) === "paid" && (
                      <button
                        type="button"
                        className="orderHistory__ticketBtn"
                        onClick={() => window.open(`/ticket/${order.booking_code}`, "_blank")}
                      >
                        🎟 Lihat Tiket
                      </button>
                    )}
                    {statusClass(order.status) === "pending" && (
                      <button
                        type="button"
                        className="orderHistory__payBtn"
                        onClick={() => handleContinuePayment(order)}
                      >
                        ⏳ Lanjutkan Pembayaran
                      </button>
                    )}
                  </div>

                  <div className="orderHistory__topRow">
                    <div className="orderHistory__meta">
                      <span>{formatOrderDate(order.created_at)}</span>
                      <span className="orderHistory__divider">|</span>
                      <span>Order ID: {order.booking_code}</span>
                    </div>

                    <div className="orderHistory__total">
                      <span className="orderHistory__totalLabel">Total:</span>
                      <span className="orderHistory__totalValue">
                        {formatRupiah(order.order_total)}
                      </span>
                    </div>
                  </div>

                  <div className="orderHistory__detailCard">
                    <div className="orderHistory__detailGrid">
                      <div className="orderHistory__thumb">
                        <button
                          type="button"
                          className="orderHistory__thumbClose"
                          onClick={() => handleToggleDetail(order)}
                          aria-label={isExpanded ? "Tutup detail" : "Lihat detail"}
                        >
                          {isExpanded ? "▲" : "▼"}
                        </button>
                        <img
                          src={order.order_item.image_url ?? (order.order_item.type === "accommodation" ? FALLBACK_ACCOMMODATION : FALLBACK_DESTINATION)}
                          alt={order.order_item.name}
                          className="orderHistory__thumbImage"
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              order.order_item.type === "accommodation" ? FALLBACK_ACCOMMODATION : FALLBACK_DESTINATION;
                          }}
                        />
                      </div>

                      <div className="orderHistory__detailText">
                        <div className="orderHistory__packageTitle">
                          {order.order_item.name}
                        </div>
                        {order.order_item.type === "accommodation" ? (
                          <>
                            <div className="orderHistory__packageCategory">Penginapan</div>
                            {order.order_item.facilities && order.order_item.facilities.length > 0 && (
                              <div className="orderHistory__packageMeta">
                                {order.order_item.facilities.join(" · ")}
                              </div>
                            )}
                            <div className="orderHistory__packageTime">
                              {order.qty} Malam
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="orderHistory__packageCategory">
                              {order.order_item.category_name}
                            </div>
                            <div className="orderHistory__packageMeta">
                              {order.order_item.date}
                            </div>
                            <div className="orderHistory__packageTime">
                              {order.order_item.start_time} - {order.order_item.end_time}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="orderHistory__visitorSection">
                      {loadingDetail && !detail ? (
                        <div className="orderHistory__visitorLoading">Memuat detail...</div>
                      ) : detail && detail.visitor_details.length > 0 ? (
                        <>
                          <div className="orderHistory__visitorTitle">Detail Pengunjung</div>
                          {detail.visitor_details.map((v, i) => (
                            <div key={v.id} className="orderHistory__visitorCard">
                              <div className="orderHistory__visitorNo">Pengunjung #{i + 1}</div>
                              <div className="orderHistory__visitorName">{v.name}</div>
                              <div className="orderHistory__visitorEmail">{v.email}</div>
                              <div className="orderHistory__visitorPhone">{v.phone_number}</div>
                            </div>
                          ))}
                          <div className="orderHistory__summaryRow">
                            <span>Qty: <strong>{detail.qty}</strong></span>
                            <span>Sub Total: <strong>{formatRupiah(detail.sub_total)}</strong></span>
                            <span>Tax: <strong>{formatRupiah(detail.tax)}</strong></span>
                          </div>
                        </>
                      ) : (
                        <div className="orderHistory__visitorLoading">Belum ada detail pengunjung.</div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
