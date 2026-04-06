import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getDestinationById,
  createOrder,
  updateOrder,
  createOrderVisitorDetails,
  getWishlists,
  addWishlist,
  removeWishlist,
} from "../../services/api";
import type { DestinationDetail, OrderResponse } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Reveal from "../../components/reveal";
import "./paket-detail.css";
import logo from "../../assets/logo.png";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop";

type VisitorForm = {
  name: string;
  email: string;
  phone_number: string;
};

function formatRupiah(value: string | number) {
  return `Rp ${Number(value).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateIndonesia(dateString: string) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatReceiptDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatReceiptDateTime(date: Date) {
  const formattedDate = date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formattedDate} ${formattedTime}`;
}

function emptyVisitor(): VisitorForm {
  return { name: "", email: "", phone_number: "" };
}

export default function PaketDetailPage() {
  const { id } = useParams();
  const { isLoggedIn } = useAuth();

  // ── destination data ──
  const [destination, setDestination] = useState<DestinationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // ── modal ui ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentDeadline, setPaymentDeadline] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // ── booking data ──
  const [qty, setQty] = useState(1);
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [visitors, setVisitors] = useState<VisitorForm[]>([emptyVisitor()]);
  const [bookingTime] = useState(() => new Date());

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDestinationById(id)
      .then((data) => { setDestination(data); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
    getWishlists()
      .then((items) => setIsWishlisted(items.some((i) => i.id === Number(id))))
      .catch(() => { });
  }, [id]);

  const handleToggleWishlist = async () => {
    const prev = isWishlisted;
    setIsWishlisted(!prev);
    try {
      if (prev) {
        await removeWishlist(Number(id));
      } else {
        await addWishlist(Number(id));
      }
    } catch {
      setIsWishlisted(prev);
    }
  };
  function formatCountdown(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} menit : ${String(seconds).padStart(2, "0")} detik`;
  }
  useEffect(() => {
    if (!isPaymentOpen || !paymentDeadline) return;

    const tick = () => {
      const diff = Math.max(0, Math.floor((paymentDeadline - Date.now()) / 1000));
      setTimeLeft(diff);
    };

    tick();
    const interval = window.setInterval(tick, 1000);

    return () => window.clearInterval(interval);
  }, [isPaymentOpen, paymentDeadline]);
  // ── derived totals (from API after order created, local estimate before) ──
  const ticketPrice = Number(destination?.price ?? 0);
  const localSubTotal = qty * ticketPrice;
  const subTotal = orderData ? Number(orderData.sub_total) : localSubTotal;
  const taxAmount = orderData ? Number(orderData.tax) : 0;
  const grandTotal = orderData ? Number(orderData.order_total) : localSubTotal;

  // ── modal helpers ──
  const openModal = () => {
    setStep(1);
    setQty(1);
    setVisitors([emptyVisitor()]);
    setOrderData(null);
    setApiError("");
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = "auto";
  };

  const closeReceipt = () => {
    setIsReceiptOpen(false);
    document.body.style.overflow = "auto";
  };

  // ── step 1: qty ──
  const handleNextFromStep1 = async () => {
    if (qty < 1 || !destination) return;
    setSubmitting(true);
    setApiError("");
    try {
      let res: OrderResponse;
      if (orderData) {
        // order already exists — update qty if changed
        res = orderData.qty !== qty
          ? await updateOrder(orderData.id, { qty })
          : orderData;
      } else {
        res = await createOrder({
          ticket_id: destination.id,
          ticket_type: "destination",
          qty,
        });
      }
      setOrderData(res);
      // re-initialise visitor forms to match current qty
      setVisitors(Array.from({ length: qty }, (_, i) => visitors[i] ?? emptyVisitor()));
      setStep(2);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Gagal membuat pesanan.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── step 2: visitor details ──
  const updateVisitor = (index: number, field: keyof VisitorForm, value: string) => {
    setVisitors((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleNextFromStep2 = async () => {
    if (visitors.some((v) => !v.name || !v.email || !v.phone_number)) {
      setApiError("Mohon lengkapi semua data pengunjung.");
      return;
    }
    if (!orderData) return;
    setSubmitting(true);
    setApiError("");
    try {
      const res = await createOrderVisitorDetails(orderData.id, visitors);
      setOrderData(res);
      setStep(3);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Gagal menyimpan detail pengunjung.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── step 3 → payment ──
  const handlePayNow = () => {
    setIsModalOpen(false);
    setTimeLeft(15 * 60);
    setPaymentDeadline(Date.now() + 15 * 60 * 1000);
    setIsPaymentOpen(true);
  };

  const closePayment = () => {
    setIsPaymentOpen(false);
    document.body.style.overflow = "auto";
  };

  const backToSummaryFromPayment = () => {
    setIsPaymentOpen(false);
    setIsModalOpen(true);
    setStep(3);
  };

  const handleCheckPaymentStatus = () => {
    // nanti kalau sudah ada API cek status pembayaran,
    // logic-nya bisa diganti di sini
    setIsPaymentOpen(false);
    setIsReceiptOpen(true);
  };
  // ── back handlers ──
  const backToStep1 = () => {
    setApiError("");
    setStep(1);
  };

  const backToStep2 = () => {
    setApiError("");
    setStep(2);
  };

  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page">
        <main className="paketDetail">
          <section className="paketDetail__content container">
            <p style={{ padding: "40px 0", color: "#6b7280" }}>Memuat...</p>
          </section>
        </main>
      </div>
    );
  }

  if (notFound || !destination) {
    return (
      <div className="page">
        <main className="paketDetail">
          <section className="paketDetail__content container">
            <h1 className="paketDetail__title">Data paket tidak ditemukan</h1>
          </section>
        </main>
      </div>
    );
  }

  const categoryName = destination.category?.name ?? destination.category_name ?? "";
  const ticketName = "Tiket Standard";
  const orderId = orderData?.id;

  return (
    <div className="page">
      <main className="paketDetail">
        <section className="paketDetail__hero">
          <img
            src={destination.image_url ?? FALLBACK_IMAGE}
            alt={destination.name}
            className="paketDetail__heroImg"
          />
        </section>

        <section className="paketDetail__contentWrap">
          <div className="paketDetail__content container">
            <div className="paketDetail__main">
              <div className="paketDetail__left">
                <Reveal>
                  <h1 className="paketDetail__title">{destination.name}</h1>
                </Reveal>

                {categoryName && (
                  <Reveal>
                    <span className="paketDetail__category">{categoryName}</span>
                  </Reveal>
                )}

                <Reveal>
                  <section className="paketDetail__section">
                    <h2 className="paketDetail__heading">Date and Time</h2>
                    <div className="paketDetail__infoItem">
                      <span className="paketDetail__icon">🗓</span>
                      <span>{formatDateIndonesia(destination.date)}</span>
                    </div>
                    {destination.start_time && destination.end_time && (
                      <div className="paketDetail__infoItem">
                        <span className="paketDetail__icon">🕒</span>
                        <span>{destination.start_time} - {destination.end_time}</span>
                      </div>
                    )}
                  </section>
                </Reveal>

                {destination.latitude && destination.longitude && (
                  <Reveal>
                    <section className="paketDetail__section">
                      <h2 className="paketDetail__heading">Location 📍</h2>
                      <div className="paketDetail__map">
                        <iframe
                          title="Lokasi Destinasi"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.google.com/maps?q=${destination.latitude},${destination.longitude}&z=15&output=embed`}
                        />
                      </div>
                    </section>
                  </Reveal>
                )}

                {destination.ticket_type && (
                  <Reveal>
                    <section className="paketDetail__section">
                      <h2 className="paketDetail__heading">Ticket Information</h2>
                      <div className="paketDetail__infoItem">
                        <span className="paketDetail__icon">🎟</span>
                        <span>
                          {destination.ticket_type === "price_per_ticket"
                            ? `Price / ticket: ${formatRupiah(destination.price ?? 0)}`
                            : destination.ticket_type}
                        </span>
                      </div>
                    </section>
                  </Reveal>
                )}

                <Reveal>
                  <section className="paketDetail__section">
                    <h2 className="paketDetail__heading">Event Description</h2>
                    <p className="paketDetail__paragraph">{destination.descriptions}</p>
                  </section>
                </Reveal>
              </div>

              <aside className="paketDetail__right">
                <Reveal variant="right">
                  <button
                    className="paketDetail__fav"
                    type="button"
                    aria-label={isWishlisted ? "hapus dari wishlist" : "tambah ke wishlist"}
                    onClick={handleToggleWishlist}
                  >
                    {isWishlisted ? "★" : "☆"}
                  </button>
                </Reveal>

                <Reveal variant="right">
                  {isLoggedIn ? (
                    <button type="button" className="paketDetail__orderBtn" onClick={openModal}>
                      🎟 Pesan Sekarang
                    </button>
                  ) : (
                    <div className="paketDetail__orderWrap">
                      <button
                        type="button"
                        className="paketDetail__orderBtn paketDetail__orderBtn--disabled"
                        disabled
                      >
                        🎟 Pesan Sekarang
                      </button>
                      <p className="paketDetail__loginNote">
                        <Link to="/login">Masuk</Link> untuk memesan tiket ini.
                      </p>
                    </div>
                  )}
                </Reveal>
              </aside>
            </div>
          </div>
        </section>
      </main>

      {/* ── BOOKING MODAL ── */}
      {isModalOpen && (
        <div className="bookingModal__overlay" onClick={closeModal}>
          <div className="bookingModal" onClick={(e) => e.stopPropagation()}>

            {/* ── STEP 1: pick qty ── */}
            {step === 1 && (
              <>
                <div className="bookingModal__header">
                  <h2 className="bookingModal__title">Pilih tiket</h2>
                  <button type="button" className="bookingModal__close" onClick={closeModal}>✕</button>
                </div>

                <div className="bookingModal__body bookingModal__body--gray">
                  <div className="ticketTable__head">
                    <span>Ticket Types</span>
                    <span>Quantity</span>
                  </div>

                  <div className="ticketItem">
                    <div className="ticketItem__accent" />
                    <div className="ticketItem__content">
                      <div className="ticketItem__info">
                        <div className="ticketItem__name">{ticketName}</div>
                        <div className="ticketItem__price">{formatRupiah(ticketPrice)}</div>
                      </div>
                      <div className="ticketQty">
                        <button type="button" onClick={() => setQty((p) => Math.max(1, p - 1))}>−</button>
                        <span>{qty}</span>
                        <button type="button" onClick={() => setQty((p) => p + 1)}>＋</button>
                      </div>
                    </div>
                  </div>

                  {apiError && <div className="bookingModal__error">{apiError}</div>}
                </div>

                <div className="bookingModal__footer">
                  <div className="bookingSummary">
                    <span>Qty: <strong>{qty}</strong></span>
                    <span>Total: <strong className="text-green">{formatRupiah(localSubTotal)}</strong></span>
                  </div>
                  <button
                    type="button"
                    className="bookingPrimaryBtn"
                    onClick={handleNextFromStep1}
                    disabled={qty < 1 || submitting}
                  >
                    {submitting ? "Memproses..." : <>Process Pembayaran <span>›</span></>}
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 2: visitor details (one form per ticket) ── */}
            {step === 2 && (
              <>
                <div className="bookingModal__header">
                  <button type="button" className="bookingModal__back" onClick={backToStep1}>←</button>
                  <h2 className="bookingModal__title">Detail Pengunjung</h2>
                  <button type="button" className="bookingModal__close" onClick={closeModal}>✕</button>
                </div>

                <div className="bookingModal__body bookingModal__body--gray">
                  <div className="visitorTop">
                    <div>
                      <div className="visitorTop__event">{destination.name}</div>
                      <div className="visitorTop__ticket">{ticketName} · {qty} tiket</div>
                    </div>
                    <div className="visitorTop__date">
                      📅 {formatDateIndonesia(destination.date)}
                    </div>
                  </div>

                  {visitors.map((v, index) => (
                    <div key={index} className="visitorFormCard">
                      {qty > 1 && (
                        <div className="visitorFormCard__heading">Pengunjung #{index + 1}</div>
                      )}

                      <label className="visitorField">
                        <span>Nama Lengkap</span>
                        <input
                          type="text"
                          placeholder="Masukkan Nama Lengkap"
                          value={v.name}
                          onChange={(e) => updateVisitor(index, "name", e.target.value)}
                        />
                      </label>

                      <label className="visitorField">
                        <span>Alamat Email</span>
                        <input
                          type="email"
                          placeholder="Masukkan Alamat Email"
                          value={v.email}
                          onChange={(e) => updateVisitor(index, "email", e.target.value)}
                        />
                      </label>

                      <label className="visitorField">
                        <span>Nomor Hp</span>
                        <div className="phoneField">
                          <span className="phoneField__prefix">🇮🇩</span>
                          <input
                            type="text"
                            placeholder="Masukkan Nomor Handphone"
                            value={v.phone_number}
                            onChange={(e) => updateVisitor(index, "phone_number", e.target.value)}
                          />
                        </div>
                      </label>
                    </div>
                  ))}

                  {apiError && <div className="bookingModal__error">{apiError}</div>}
                </div>

                <div className="bookingModal__footer">
                  <div className="bookingSummary">
                    <span>Qty: <strong>{qty}</strong></span>
                    <span>Total: <strong className="text-green">{formatRupiah(subTotal)}</strong></span>
                  </div>
                  <button
                    type="button"
                    className="bookingPrimaryBtn bookingPrimaryBtn--muted"
                    onClick={handleNextFromStep2}
                    disabled={submitting}
                  >
                    {submitting ? "Menyimpan..." : <>Lanjutkan Pembayaran <span>›</span></>}
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 3: order summary ── */}
            {step === 3 && orderData && (
              <>
                <div className="bookingModal__header">
                  <button type="button" className="bookingModal__back" onClick={backToStep2}>←</button>
                  <h2 className="bookingModal__title">Ringkasan Pesanan</h2>
                  <button type="button" className="bookingModal__close" onClick={closeModal}>✕</button>
                </div>

                <div className="bookingModal__body bookingModal__body--gray bookingModal__body--summary">
                  {orderData.order_visitor_details.map((v, index) => (
                    <div key={v.id} className="ticketSummaryCard">
                      <div className="ticketSummaryCard__title">{ticketName} #{index + 1}</div>
                      <div className="ticketSummaryCard__content">
                        <div>
                          <div className="ticketSummaryCard__label">Nama Pengunjung</div>
                          <div className="ticketSummaryCard__value">{v.name}</div>
                          <div className="ticketSummaryCard__value">{v.email}</div>
                        </div>
                        <div className="ticketSummaryCard__badge">
                          {formatRupiah(ticketPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bookingModal__footer bookingModal__footer--summary">
                  <div className="paymentSummary">
                    <div className="paymentSummary__row">
                      <span>Sub Total:</span>
                      <strong>{formatRupiah(subTotal)}</strong>
                    </div>
                    <div className="paymentSummary__row">
                      <span>Tax:</span>
                      <strong>{formatRupiah(taxAmount)}</strong>
                    </div>
                    <div className="paymentSummary__divider" />
                    <div className="paymentSummary__row paymentSummary__row--grand">
                      <span>Order Total:</span>
                      <strong className="text-green">{formatRupiah(grandTotal)}</strong>
                    </div>
                  </div>

                  <button type="button" className="bookingPayBtn" onClick={handlePayNow}>
                    🔒 Bayar Sekarang
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* ── PAYMENT MODAL ── */}
      {isPaymentOpen && orderData && (
        <div className="paymentModal__overlay" onClick={closePayment}>
          <div className="paymentModal" onClick={(e) => e.stopPropagation()}>
            <div className="paymentModal__header">
              <button
                type="button"
                className="paymentModal__back"
                onClick={backToSummaryFromPayment}
              >
                ←
              </button>
              <h2 className="paymentModal__title">Pembayaran</h2>
            </div>

            <div className="paymentModal__orderId">
              Order ID: <strong>{orderData.id}</strong>
            </div>

            <div className="paymentModal__timerBox">
              <span className="paymentModal__timerIcon">⏰</span>
              <span>
                Silakan selesaikan pembayaranmu dalam{" "}
                <strong>{formatCountdown(timeLeft)}</strong>
              </span>
            </div>

            <div className="paymentModal__qrCard">
              <div className="paymentModal__qrTitle">
                Gunakan aplikasi pembayaran kamu untuk scan QR Code berikut
              </div>

              <img
                className="paymentModal__qrImage"
                alt="QR Code Pembayaran"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  JSON.stringify({
                    orderId: orderData.id,
                    destination: destination.name,
                    qty,
                    total: grandTotal,
                    paymentMethod: "QRIS",
                  })
                )}`}
              />
            </div>

            <button
              type="button"
              className="paymentModal__checkBtn"
              onClick={handleCheckPaymentStatus}
              disabled={timeLeft === 0}
            >
              {timeLeft === 0 ? "Waktu Pembayaran Habis" : "Cek Status Pembayaran"}
            </button>

            <div className="paymentModal__infoBox">
              <div className="paymentModal__infoIcon">!</div>

              <ul className="paymentModal__infoList">
                <li>Buka aplikasi pembayaran (e-wallet atau mobile banking).</li>
                <li>Scan QR Code yang ditampilkan pada halaman ini.</li>
                <li>Ikuti instruksi di aplikasi hingga pembayaran berhasil.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* ── RECEIPT MODAL ── */}
      {isReceiptOpen && orderData && (
        <div className="receiptModal__overlay" onClick={closeReceipt}>
          <div className="receiptModal" onClick={(e) => e.stopPropagation()}>
            <div className="receiptModal__header">
              <button type="button" className="receiptModal__close" onClick={closeReceipt}>✕</button>
            </div>

            <div className="receiptModal__logoWrap">
              <img className="receipt__logo" src={logo} alt="Logo" />
            </div>

            <h1 className="receiptModal__title">Bukti Pembayaran Tiket</h1>

            <div className="receiptModal__meta">
              <div className="receiptModal__date">{formatReceiptDate(bookingTime)}</div>
              <div className="receiptModal__orderId">Order ID: {orderId}</div>
            </div>

            {orderData.order_visitor_details.map((v, index) => (
              <div key={v.id} className="receiptTicket">
                <div className="receiptTicket__topLine" />
                <div className="receiptTicket__type">{ticketName} #{index + 1}</div>
                <div className="receiptTicket__content">
                  <div className="receiptTicket__left">
                    <div className="receiptTicket__destination">{destination.name}</div>
                    <div className="receiptTicket__visitor">{v.name}</div>
                    <div className="receiptTicket__visitor">{v.email}</div>
                    <div className="receiptTicket__visitor">{v.phone_number}</div>
                  </div>
                  <div className="receiptTicket__qrWrap">
                    <img
                      className="receiptTicket__qr"
                      alt="QR Code Tiket"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                        JSON.stringify({ orderId, ticket: index + 1, destination: destination.name, visitor: v.name, email: v.email })
                      )}`}
                    />
                  </div>
                </div>
                <div className="receiptTicket__bottomLine" />
              </div>
            ))}

            <div className="receiptModal__infoRow">
              <div>
                <div className="receiptModal__label">Metode Pembayaran</div>
                <div className="receiptModal__label">Waktu Pemesanan</div>
              </div>
              <div className="receiptModal__infoRight">
                <div className="receiptModal__paymentMethod">BCA</div>
                <div className="receiptModal__bookingTime">{formatReceiptDateTime(bookingTime)}</div>
              </div>
            </div>

            <div className="receiptModal__summaryWrap">
              <div className="receiptSummary">
                <div className="receiptSummary__row">
                  <span>Sub Total:</span>
                  <strong>{formatRupiah(subTotal)}</strong>
                </div>
                <div className="receiptSummary__row">
                  <span>Tax:</span>
                  <strong>{formatRupiah(taxAmount)}</strong>
                </div>
                <div className="receiptSummary__divider" />
                <div className="receiptSummary__row receiptSummary__row--grand">
                  <span>Order Total:</span>
                  <strong className="text-green">{formatRupiah(grandTotal)}</strong>
                </div>
              </div>
            </div>

            <p className="receiptModal__note">
              Struk ini merupakan bukti sah pembelian tiket dan wajib disimpan
              oleh pelanggan. Tiket hanya berlaku sesuai dengan detail yang
              tertera (tanggal, waktu, dan tujuan) serta tidak dapat dipindah
              tangankan tanpa persetujuan. Perubahan atau pembatalan tiket dapat
              dikenakan biaya sesuai kebijakan yang berlaku, dan beberapa tiket
              mungkin tidak dapat dikembalikan (non-refundable). Keterlambatan
              atau ketidakhadiran penumpang dapat dianggap sebagai pembatalan
              tanpa pengembalian dana. Penyedia layanan tidak bertanggung jawab
              atas gangguan yang disebabkan oleh keadaan di luar kendali (force
              majeure). Dengan melakukan pembelian, pelanggan dianggap telah
              membaca, memahami, dan menyetujui seluruh syarat dan ketentuan ini.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
