import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPaymentDetails, markOrderPaid, cancelOrder } from "../../services/api";
import type { PaymentPageDetails, OrderResponse } from "../../services/api";
import "./payment.css";

function formatRupiah(value: string | number) {
  return `Rp ${Number(value).toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Extract numeric order ID from booking code, e.g. "ORD-00000022" → 22 */
function parseOrderId(details: PaymentPageDetails): number | null {
  if (details.id) return details.id;
  const match = details.booking_code.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

type ResultState = { type: "paid"; order: OrderResponse } | { type: "failed"; order: OrderResponse } | null;

export default function PaymentPage() {
  const { booking_code } = useParams<{ booking_code: string }>();

  const [details, setDetails] = useState<PaymentPageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState>(null);

  useEffect(() => {
    if (!booking_code) return;
    getPaymentDetails(booking_code)
      .then(setDetails)
      .catch(() => setError("Pesanan tidak ditemukan atau sudah kadaluarsa."))
      .finally(() => setLoading(false));
  }, [booking_code]);

  const handlePay = async () => {
    const orderId = details ? parseOrderId(details) : null;
    if (!orderId) { setError("Tidak dapat menemukan ID pesanan."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await markOrderPaid(orderId);
      setResult({ type: "paid", order: res });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses pembayaran.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    const orderId = details ? parseOrderId(details) : null;
    if (!orderId) { setError("Tidak dapat menemukan ID pesanan."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await cancelOrder(orderId);
      setResult({ type: "failed", order: res });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membatalkan pesanan.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Error ──
  if (loading) {
    return (
      <div className="payPage">
        <div className="payPage__card">
          <p className="payPage__loading">Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  if (error && !details) {
    return (
      <div className="payPage">
        <div className="payPage__card">
          <p className="payPage__errorMsg">{error}</p>
        </div>
      </div>
    );
  }

  // ── Result: PAID ──
  if (result?.type === "paid") {
    const o = result.order;
    return (
      <div className="payPage">
        <div className="payPage__card">
          <div className="payPage__resultHero payPage__resultHero--paid">
            <div className="payPage__resultIcon">✓</div>
            <h2>Pembayaran Berhasil!</h2>
            <p>Terima kasih atas kepercayaan Anda</p>
          </div>
          <div className="payPage__resultBody">
            <div className="payPage__bookingBox payPage__bookingBox--paid">
              <div className="payPage__bookingLabel">KODE BOOKING</div>
              <div className="payPage__bookingCode">{o.booking_code ?? `ORD-${String(o.id).padStart(8,"0")}`}</div>
            </div>
            <div className="payPage__rows">
              <div className="payPage__row"><span>Item</span><strong>{o.order_item.name}</strong></div>
              <div className="payPage__row"><span>Jumlah Tiket</span><strong>{o.qty} Tiket</strong></div>
              <div className="payPage__rowDivider" />
              <div className="payPage__row"><span>Sub Total</span><span>{formatRupiah(o.sub_total)}</span></div>
              <div className="payPage__row"><span>Pajak</span><span>{formatRupiah(o.tax)}</span></div>
              <div className="payPage__row payPage__row--grand"><span>Total</span><strong>{formatRupiah(o.order_total)}</strong></div>
            </div>
            <p className="payPage__resultNote">Tiket telah dikirim ke email Anda.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Result: FAILED / CANCELLED ──
  if (result?.type === "failed") {
    const o = result.order;
    return (
      <div className="payPage">
        <div className="payPage__card">
          <div className="payPage__resultHero payPage__resultHero--failed">
            <div className="payPage__resultIcon">✕</div>
            <h2>Pesanan Dibatalkan</h2>
            <p>Pesanan Anda telah dibatalkan</p>
          </div>
          <div className="payPage__resultBody">
            <div className="payPage__bookingBox payPage__bookingBox--failed">
              <div className="payPage__bookingLabel">KODE BOOKING</div>
              <div className="payPage__bookingCode payPage__bookingCode--failed">{o.booking_code ?? `ORD-${String(o.id).padStart(8,"0")}`}</div>
            </div>
            <div className="payPage__rows">
              <div className="payPage__row"><span>Item</span><strong>{o.order_item.name}</strong></div>
              <div className="payPage__row"><span>Jumlah Tiket</span><strong>{o.qty} Tiket</strong></div>
              <div className="payPage__row payPage__row--grand"><span>Total</span><strong>{formatRupiah(o.order_total)}</strong></div>
            </div>
            <p className="payPage__resultNote">Silakan buat pesanan baru jika ingin memesan kembali.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Payment Screen ──
  return (
    <div className="payPage">
      <div className="payPage__card">
        {/* Header */}
        <div className="payPage__header">
          <div className="payPage__headerLogo">🏡</div>
          <div className="payPage__headerInfo">
            <div className="payPage__headerName">Desa Wisata Manud Jaya</div>
            <div className="payPage__headerSub">TRANSFER QRIS</div>
          </div>
        </div>

        {/* Item info */}
        <div className="payPage__itemInfo">
          <div className="payPage__itemName">{details!.item_name}</div>
          <div className="payPage__itemMeta">{details!.qty} tiket • {details!.item_type === "destination" ? "Destinasi Wisata" : "Penginapan"}</div>
        </div>

        {/* QR */}
        <div className="payPage__qrWrap">
          {details!.payment_qr_url ? (
            <img src={details!.payment_qr_url} alt="QR Code Pembayaran" className="payPage__qrImg" />
          ) : (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(booking_code ?? "")}`}
              alt="QR Code Pembayaran"
              className="payPage__qrImg"
            />
          )}
          <p className="payPage__qrLabel">Scan untuk membayar</p>
        </div>

        {/* Amount breakdown */}
        <div className="payPage__amounts">
          <div className="payPage__amountRow">
            <span>JUMLAH</span>
            <strong>{formatRupiah(details!.sub_total)}</strong>
          </div>
          <div className="payPage__amountRow">
            <span>PAJAK (10%)</span>
            <strong>{formatRupiah(details!.tax)}</strong>
          </div>
          <div className="payPage__amountRow payPage__amountRow--total">
            <span>TOTAL</span>
            <strong>{formatRupiah(details!.total_amount)}</strong>
          </div>
        </div>

        {/* Booking code */}
        <div className="payPage__bookingRef">
          <span>Kode Booking:</span>
          <strong>{details!.booking_code}</strong>
        </div>

        {error && <div className="payPage__error">{error}</div>}

        {/* Action buttons */}
        <div className="payPage__actions">
          <button
            type="button"
            className="payPage__cancelBtn"
            onClick={handleCancel}
            disabled={submitting}
          >
            Batalkan
          </button>
          <button
            type="button"
            className="payPage__payBtn"
            onClick={handlePay}
            disabled={submitting}
          >
            {submitting ? "Memproses..." : "OK / Bayar"}
          </button>
        </div>

        <p className="payPage__disclaimer">
          Halaman ini adalah simulasi pembayaran. Dalam implementasi nyata, pembayaran diproses melalui payment gateway.
        </p>
      </div>
    </div>
  );
}
