import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPaymentDetails } from "../../services/api";
import type { PaymentPageDetails } from "../../services/api";
import "./ticket.css";

function formatRupiah(value: string | number) {
  return `Rp ${Number(value).toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPrintDate() {
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketPage() {
  const { booking_code } = useParams<{ booking_code: string }>();

  const [details, setDetails] = useState<PaymentPageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!booking_code) return;
    getPaymentDetails(booking_code)
      .then(setDetails)
      .catch(() => setError("Tiket tidak ditemukan atau kode booking tidak valid."))
      .finally(() => setLoading(false));
  }, [booking_code]);

  if (loading) {
    return (
      <div className="ticketPage">
        <div className="ticketPage__card">
          <p className="ticketPage__loading">Memuat tiket...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="ticketPage">
        <div className="ticketPage__card">
          <p className="ticketPage__errorMsg">{error || "Tiket tidak ditemukan."}</p>
        </div>
      </div>
    );
  }

  const isPaid = details.status.toLowerCase() === "paid";
  const isAccommodation = details.item_type === "accommodation";

  return (
    <div className="ticketPage">
      <div className="ticketPage__card" id="ticket-print-area">

        {/* ── Header ── */}
        <div className="ticketPage__header">
          <div className="ticketPage__headerLogo">🏡</div>
          <div className="ticketPage__headerInfo">
            <div className="ticketPage__headerName">Desa Wisata Manud Jaya</div>
            <div className="ticketPage__headerSub">Jl. Manud Jaya, Indonesia</div>
          </div>
          <div className="ticketPage__headerBadge">
            {isPaid ? "LUNAS" : details.status.toUpperCase()}
          </div>
        </div>

        {/* ── Title strip ── */}
        <div className={`ticketPage__titleStrip ${isPaid ? "ticketPage__titleStrip--paid" : "ticketPage__titleStrip--pending"}`}>
          <span>{isAccommodation ? "🏨 TIKET PENGINAPAN" : "🎫 TIKET DESTINASI WISATA"}</span>
        </div>

        {/* ── Booking code ── */}
        <div className="ticketPage__bookingSection">
          <div className="ticketPage__bookingLabel">KODE BOOKING</div>
          <div className={`ticketPage__bookingCode ${isPaid ? "ticketPage__bookingCode--paid" : ""}`}>
            {details.booking_code}
          </div>
        </div>

        {/* ── Divider with holes ── */}
        <div className="ticketPage__tear">
          <div className="ticketPage__tearHole ticketPage__tearHole--left" />
          <div className="ticketPage__tearLine" />
          <div className="ticketPage__tearHole ticketPage__tearHole--right" />
        </div>

        {/* ── Item details ── */}
        <div className="ticketPage__detail">
          <div className="ticketPage__detailRow">
            <span className="ticketPage__detailLabel">
              {isAccommodation ? "Nama Kamar" : "Nama Destinasi"}
            </span>
            <strong className="ticketPage__detailValue">{details.item_name}</strong>
          </div>
          <div className="ticketPage__detailRow">
            <span className="ticketPage__detailLabel">Tipe</span>
            <span className="ticketPage__detailValue">
              {isAccommodation ? "Penginapan" : "Destinasi Wisata"}
            </span>
          </div>
          <div className="ticketPage__detailRow">
            <span className="ticketPage__detailLabel">
              {isAccommodation ? "Jumlah Malam" : "Jumlah Tiket"}
            </span>
            <span className="ticketPage__detailValue">
              {details.qty} {isAccommodation ? "Malam" : "Tiket"}
            </span>
          </div>
        </div>

        {/* ── Price breakdown ── */}
        <div className="ticketPage__pricing">
          <div className="ticketPage__pricingRow">
            <span>Sub Total</span>
            <span>{formatRupiah(details.sub_total)}</span>
          </div>
          <div className="ticketPage__pricingRow">
            <span>Pajak (10%)</span>
            <span>{formatRupiah(details.tax)}</span>
          </div>
          <div className="ticketPage__pricingDivider" />
          <div className="ticketPage__pricingRow ticketPage__pricingRow--total">
            <span>Total Pembayaran</span>
            <strong>{formatRupiah(details.total_amount)}</strong>
          </div>
        </div>

        {/* ── Status note ── */}
        {!isPaid && (
          <div className="ticketPage__unpaidNote">
            ⚠️ Pembayaran belum terkonfirmasi. Tunjukkan tiket ini setelah pembayaran selesai.
          </div>
        )}

        {/* ── Footer ── */}
        <div className="ticketPage__footer">
          <p>Terima kasih telah memilih Desa Wisata Manud Jaya</p>
          <p className="ticketPage__footerDate">Dicetak pada: {formatPrintDate()}</p>
          <p className="ticketPage__footerContact">noreply@desamanudjaya.com</p>
        </div>
      </div>

      {/* ── Print button (hidden when printing) ── */}
      <div className="ticketPage__printWrap no-print">
        <button
          type="button"
          className="ticketPage__printBtn"
          onClick={() => window.print()}
        >
          🖨️ Cetak / Simpan PDF
        </button>
      </div>
    </div>
  );
}
