import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getAccommodations,
  getAccommodationById,
  getOrderHistory,
  createOrder,
  updateOrder,
  createOrderVisitorDetails,
  payNowOrder,
  checkPaymentStatus,
} from "../../services/api";
import type { Accommodation, OrderResponse, OrderHistoryItem } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Reveal from "../../components/reveal";
import "./penginapan.css";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=600&auto=format&fit=crop";

type VisitorForm = { name: string; email: string; phone_number: string };

function formatRupiah(value: string | number) {
  return `Rp ${Number(value).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function emptyVisitor(): VisitorForm {
  return { name: "", email: "", phone_number: "" };
}
function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} menit : ${String(seconds).padStart(2, "0")} detik`;
}

function adaptToOrderResponse(order: OrderHistoryItem): OrderResponse {
  return {
    id: order.id,
    booking_code: order.booking_code,
    user_id: 0,
    user_name: "",
    qty: order.qty,
    order_total: order.order_total,
    tax: order.tax,
    sub_total: order.sub_total,
    status: order.status,
    payment_qr_url: null,
    ticket_qr_url: null,
    order_item: order.order_item,
    order_visitor_details: order.visitor_details,
  };
}

export default function PenginapanPage() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Accommodation[]>([]);

  // modal state
  const [selectedRoom, setSelectedRoom] = useState<Accommodation | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [qty, setQty] = useState(1);
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [visitor, setVisitor] = useState<VisitorForm>(emptyVisitor());
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // payment modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentDeadline, setPaymentDeadline] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const autoCheckedRef = useRef(false);

  // result modals
  const [isPaidOpen, setIsPaidOpen] = useState(false);
  const [isFailedOpen, setIsFailedOpen] = useState(false);
  const [ticketUrl, setTicketUrl] = useState<string | null>(null);

  useEffect(() => {
    getAccommodations().then(setRooms).catch(() => { });
  }, []);

  // resume a draft accommodation order from riwayat-pesanan
  useEffect(() => {
    const resumeOrder: OrderHistoryItem | undefined = location.state?.resumeOrder;
    if (!resumeOrder) return;
    navigate(location.pathname, { replace: true, state: null });

    getOrderHistory(resumeOrder.id)
      .then(async (detail) => {
        if (detail.status.toLowerCase() !== "draft") return;
        const room = await getAccommodationById(detail.order_item.id);
        const adapted = adaptToOrderResponse(detail);
        setSelectedRoom(room);
        setOrderData(adapted);
        setQty(adapted.qty);
        setStep(detail.visitor_details.length > 0 ? 3 : 2);
        document.body.style.overflow = "hidden";
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // continue payment for a waiting_for_payment accommodation order
  useEffect(() => {
    const openPayment: OrderHistoryItem | undefined = location.state?.openPayment;
    if (!openPayment) return;
    navigate(location.pathname, { replace: true, state: null });

    const adapted = adaptToOrderResponse(openPayment);
    const deadline = new Date(openPayment.updated_at).getTime() + 10 * 60 * 1000;
    const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
    setOrderData(adapted);
    setPaymentDeadline(deadline);
    setTimeLeft(remaining);
    setIsPaymentOpen(true);
    document.body.style.overflow = "hidden";
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // countdown timer
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

  // auto-check when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && isPaymentOpen && !autoCheckedRef.current) {
      autoCheckedRef.current = true;
      doCheckPaymentStatus(true);
    }
  }, [timeLeft, isPaymentOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isPaymentOpen) autoCheckedRef.current = false;
  }, [isPaymentOpen]);

  const ticketPrice = Number(selectedRoom?.price ?? 0);
  const localSubTotal = qty * ticketPrice;
  const subTotal   = orderData ? Number(orderData.sub_total)   : localSubTotal;
  const taxAmount  = orderData ? Number(orderData.tax)         : 0;
  const grandTotal = orderData ? Number(orderData.order_total) : localSubTotal;

  const openModal = (room: Accommodation) => {
    setSelectedRoom(room);
    setStep(1);
    setQty(1);
    setOrderData(null);
    setVisitor(emptyVisitor());
    setApiError("");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedRoom(null);
    document.body.style.overflow = "auto";
  };

  const closePayment = () => {
    setIsPaymentOpen(false);
    document.body.style.overflow = "auto";
  };

  const backToSummaryFromPayment = () => {
    setIsPaymentOpen(false);
    setStep(3);
    document.body.style.overflow = "hidden";
  };

  // check payment status (manual or auto on timeout)
  const doCheckPaymentStatus = async (isTimeout = false) => {
    if (!orderData) return;
    setCheckingPayment(true);
    try {
      const res = await checkPaymentStatus(orderData.id);
      if (res.qr_url) {
        setOrderData((prev) => prev ? { ...prev, payment_qr_url: res.qr_url } : prev);
      }
      if (res.status.toLowerCase() === "paid") {
        setTicketUrl(res.ticket_url ?? null);
        setIsPaymentOpen(false);
        setIsPaidOpen(true);
        document.body.style.overflow = "hidden";
      } else if (
        res.status.toLowerCase() === "failed" ||
        res.status.toLowerCase() === "cancelled" ||
        isTimeout
      ) {
        setIsPaymentOpen(false);
        setIsFailedOpen(true);
        document.body.style.overflow = "hidden";
      }
    } catch {
      if (isTimeout) {
        setIsPaymentOpen(false);
        setIsFailedOpen(true);
        document.body.style.overflow = "hidden";
      }
    } finally {
      setCheckingPayment(false);
    }
  };

  // Step 1 → 2
  const handleNextFromStep1 = async () => {
    if (qty < 1 || !selectedRoom) return;
    setSubmitting(true);
    setApiError("");
    try {
      let res: OrderResponse;
      if (orderData) {
        res = orderData.qty !== qty
          ? await updateOrder(orderData.id, { qty })
          : orderData;
      } else {
        res = await createOrder({ ticket_id: selectedRoom.id, ticket_type: "accommodation", qty });
      }
      setOrderData(res);
      setStep(2);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Gagal membuat pesanan.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 → 3
  const handleNextFromStep2 = async () => {
    if (!visitor.name || !visitor.email || !visitor.phone_number) {
      setApiError("Mohon lengkapi semua data tamu.");
      return;
    }
    if (!orderData) return;
    setSubmitting(true);
    setApiError("");
    try {
      const res = await createOrderVisitorDetails(orderData.id, [visitor]);
      setOrderData(res);
      setStep(3);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Gagal menyimpan detail tamu.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3 → pay_now → payment modal
  const handlePayNow = async () => {
    if (!orderData) return;
    setSubmitting(true);
    setApiError("");
    try {
      const res = await payNowOrder(orderData.id);
      setOrderData(res);
      const deadline = Date.now() + 10 * 60 * 1000;
      setPaymentDeadline(deadline);
      setTimeLeft(10 * 60);
      setSelectedRoom(null);
      navigate(location.pathname, { replace: true, state: null });
      setIsPaymentOpen(true);
      document.body.style.overflow = "hidden";
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Gagal memproses pembayaran.");
    } finally {
      setSubmitting(false);
    }
  };

  const backToStep1 = () => { setApiError(""); setStep(1); };
  const backToStep2 = () => { setApiError(""); setStep(2); };

  return (
    <div className="penginapanPage">
      <section className="penginapanHero">
        <div className="penginapanHero__inner">
          <h1 className="penginapanHero__title">PENGINAPAN</h1>
          <div className="penginapanHero__line" />
        </div>
      </section>

      <section className="penginapanSection">
        <div className="penginapanContainer">
          {rooms.map((room) => (
            <Reveal key={room.id}>
              <article className="roomCard">
                <h2 className="roomCard__title">{room.name}</h2>
                <div className="roomCard__content">
                  <div className="roomCard__imageWrap">
                    <div className="roomCard__image">
                      <img
                        src={room.image_url ?? FALLBACK_IMAGE}
                        alt={room.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  </div>
                  <div className="roomCard__detail">
                    <h3 className="roomCard__subtitle">Fasilitas:</h3>
                    <ul className="roomCard__list">
                      {room.facilities.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="roomCard__divider" />
                <div className="roomCard__price">{formatRupiah(room.price)} / Malam</div>
                {isLoggedIn ? (
                  <button className="roomCard__button" type="button" onClick={() => openModal(room)}>
                    PESAN SEKARANG
                  </button>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <button className="roomCard__button roomCard__button--disabled" type="button" disabled>
                      PESAN SEKARANG
                    </button>
                    <p className="roomCard__loginNote">
                      <a href="/login">Masuk</a> untuk memesan kamar ini.
                    </p>
                  </div>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── BOOKING MODAL ── */}
      {selectedRoom && (
        <div className="bookingModal__overlay" onClick={closeModal}>
          <div className="bookingModal" onClick={(e) => e.stopPropagation()}>

            {step === 1 && (
              <>
                <div className="bookingModal__header">
                  <h2 className="bookingModal__title">Pilih Malam</h2>
                  <button type="button" className="bookingModal__close" onClick={closeModal}>✕</button>
                </div>
                <div className="bookingModal__body bookingModal__body--gray">
                  <div className="ticketTable__head">
                    <span>Tipe Kamar</span>
                    <span>Jumlah Malam</span>
                  </div>
                  <div className="ticketItem">
                    <div className="ticketItem__accent" />
                    <div className="ticketItem__content">
                      <div className="ticketItem__info">
                        <div className="ticketItem__name">{selectedRoom.name}</div>
                        <div className="ticketItem__price">{formatRupiah(selectedRoom.price)} / malam</div>
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
                    <span>Malam: <strong>{qty}</strong></span>
                    <span>Total: <strong className="text-green">{formatRupiah(localSubTotal)}</strong></span>
                  </div>
                  <button type="button" className="bookingPrimaryBtn" onClick={handleNextFromStep1} disabled={submitting}>
                    {submitting ? "Memproses..." : <>Process Pembayaran <span>›</span></>}
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="bookingModal__header">
                  <button type="button" className="bookingModal__back" onClick={backToStep1}>←</button>
                  <h2 className="bookingModal__title">Detail Tamu</h2>
                  <button type="button" className="bookingModal__close" onClick={closeModal}>✕</button>
                </div>
                <div className="bookingModal__body bookingModal__body--gray">
                  <div className="visitorTop">
                    <div>
                      <div className="visitorTop__event">{selectedRoom.name}</div>
                      <div className="visitorTop__ticket">{qty} malam</div>
                    </div>
                  </div>
                  <div className="visitorFormCard">
                    <label className="visitorField">
                      <span>Nama Lengkap</span>
                      <input type="text" placeholder="Masukkan Nama Lengkap" value={visitor.name}
                        onChange={(e) => setVisitor((v) => ({ ...v, name: e.target.value }))} />
                    </label>
                    <label className="visitorField">
                      <span>Alamat Email</span>
                      <input type="email" placeholder="Masukkan Alamat Email" value={visitor.email}
                        onChange={(e) => setVisitor((v) => ({ ...v, email: e.target.value }))} />
                    </label>
                    <label className="visitorField">
                      <span>Nomor Hp</span>
                      <div className="phoneField">
                        <span className="phoneField__prefix">🇮🇩</span>
                        <input type="text" placeholder="Masukkan Nomor Handphone" value={visitor.phone_number}
                          onChange={(e) => setVisitor((v) => ({ ...v, phone_number: e.target.value }))} />
                      </div>
                    </label>
                  </div>
                  {apiError && <div className="bookingModal__error">{apiError}</div>}
                </div>
                <div className="bookingModal__footer">
                  <div className="bookingSummary">
                    <span>Malam: <strong>{qty}</strong></span>
                    <span>Total: <strong className="text-green">{formatRupiah(subTotal)}</strong></span>
                  </div>
                  <button type="button" className="bookingPrimaryBtn bookingPrimaryBtn--muted"
                    onClick={handleNextFromStep2} disabled={submitting}>
                    {submitting ? "Menyimpan..." : <>Lanjutkan Pembayaran <span>›</span></>}
                  </button>
                </div>
              </>
            )}

            {step === 3 && orderData && (
              <>
                <div className="bookingModal__header">
                  <button type="button" className="bookingModal__back" onClick={backToStep2}>←</button>
                  <h2 className="bookingModal__title">Ringkasan Pesanan</h2>
                  <button type="button" className="bookingModal__close" onClick={closeModal}>✕</button>
                </div>
                <div className="bookingModal__body bookingModal__body--gray bookingModal__body--summary">
                  {orderData.order_visitor_details.map((v) => (
                    <div key={v.id} className="ticketSummaryCard">
                      <div className="ticketSummaryCard__title">{selectedRoom.name}</div>
                      <div className="ticketSummaryCard__content">
                        <div>
                          <div className="ticketSummaryCard__label">Nama Tamu</div>
                          <div className="ticketSummaryCard__value">{v.name}</div>
                          <div className="ticketSummaryCard__value">{v.email}</div>
                        </div>
                        <div className="ticketSummaryCard__badge">{formatRupiah(ticketPrice)}/mlm</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bookingModal__footer bookingModal__footer--summary">
                  <div className="paymentSummary">
                    <div className="paymentSummary__row">
                      <span>Sub Total:</span><strong>{formatRupiah(subTotal)}</strong>
                    </div>
                    <div className="paymentSummary__row">
                      <span>Tax:</span><strong>{formatRupiah(taxAmount)}</strong>
                    </div>
                    <div className="paymentSummary__divider" />
                    <div className="paymentSummary__row paymentSummary__row--grand">
                      <span>Order Total:</span>
                      <strong className="text-green">{formatRupiah(grandTotal)}</strong>
                    </div>
                  </div>
                  {apiError && <div className="bookingModal__error">{apiError}</div>}
                  <button type="button" className="bookingPayBtn" onClick={handlePayNow} disabled={submitting}>
                    {submitting ? "Memproses..." : "🔒 Bayar Sekarang"}
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
              <button type="button" className="paymentModal__back" onClick={backToSummaryFromPayment}>←</button>
              <h2 className="paymentModal__title">Pembayaran</h2>
            </div>

            <div className="paymentModal__orderId">
              Kode Booking: <strong>{orderData.booking_code ?? `ORD-${String(orderData.id).padStart(8, "0")}`}</strong>
            </div>

            <div className="paymentModal__timerBox">
              <span className="paymentModal__timerIcon">⏰</span>
              <span>Selesaikan pembayaran dalam <strong>{formatCountdown(timeLeft)}</strong></span>
            </div>

            <div className="paymentModal__qrCard">
              <div className="paymentModal__qrTitle">Scan QR Code untuk membayar</div>
              <img
                className="paymentModal__qrImage"
                alt="QR Code Pembayaran"
                src={
                  orderData.payment_qr_url ??
                  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    `${window.location.origin}/payment/${orderData.booking_code ?? orderData.id}`
                  )}`
                }
              />
            </div>

            {/* Order summary */}
            <div className="paymentModal__summary">
              <div className="paymentModal__summaryRow">
                <span>Kamar</span>
                <strong>{orderData.order_item.name}</strong>
              </div>
              <div className="paymentModal__summaryRow">
                <span>Jumlah Malam</span>
                <strong>{orderData.qty} Malam</strong>
              </div>
              <div className="paymentModal__summaryDivider" />
              <div className="paymentModal__summaryRow">
                <span>Sub Total</span>
                <span>{formatRupiah(orderData.sub_total)}</span>
              </div>
              <div className="paymentModal__summaryRow">
                <span>Pajak (10%)</span>
                <span>{formatRupiah(orderData.tax)}</span>
              </div>
              <div className="paymentModal__summaryRow paymentModal__summaryRow--total">
                <span>Total Pembayaran</span>
                <strong className="text-green">{formatRupiah(orderData.order_total)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="paymentModal__checkBtn"
              onClick={() => doCheckPaymentStatus(false)}
              disabled={checkingPayment || timeLeft === 0}
            >
              {checkingPayment ? "Mengecek..." : timeLeft === 0 ? "Waktu Pembayaran Habis" : "Cek Status Pembayaran"}
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

      {/* ── PAID MODAL ── */}
      {isPaidOpen && orderData && (
        <div className="resultModal__overlay" onClick={() => { setIsPaidOpen(false); document.body.style.overflow = "auto"; }}>
          <div className="resultModal resultModal--paid" onClick={(e) => e.stopPropagation()}>
            <div className="resultModal__hero resultModal__hero--paid">
              <div className="resultModal__icon">✓</div>
              <h2 className="resultModal__heroTitle">Pembayaran Berhasil!</h2>
              <p className="resultModal__heroSub">Terima kasih atas kepercayaan Anda kepada Desa Wisata Manud Jaya</p>
            </div>
            <div className="resultModal__body">
              <div className="resultModal__bookingBox resultModal__bookingBox--paid">
                <div className="resultModal__bookingLabel">KODE BOOKING</div>
                <div className="resultModal__bookingCode">
                  {orderData.booking_code ?? `ORD-${String(orderData.id).padStart(8, "0")}`}
                </div>
              </div>
              <div className="resultModal__section">
                <div className="resultModal__sectionTitle">Ringkasan Pesanan</div>
                <div className="resultModal__row"><span>Kamar</span><strong>{orderData.order_item.name}</strong></div>
                <div className="resultModal__row"><span>Jumlah Malam</span><strong>{orderData.qty} Malam</strong></div>
                <div className="resultModal__divider" />
                <div className="resultModal__row"><span>Sub Total</span><span>{formatRupiah(orderData.sub_total)}</span></div>
                <div className="resultModal__row"><span>Pajak (10%)</span><span>{formatRupiah(orderData.tax)}</span></div>
                <div className="resultModal__row resultModal__row--grand"><span>Total Pembayaran</span><strong className="text-green">{formatRupiah(orderData.order_total)}</strong></div>
              </div>
              <div className="resultModal__ticketNote">
                <span>🏨</span>
                <div>
                  <strong>Konfirmasi telah dikirim!</strong>
                  <p>Cek email Anda untuk detail pemesanan kamar.</p>
                </div>
              </div>
              {orderData && (
                <button
                  type="button"
                  className="resultModal__ticketBtn"
                  onClick={() => navigate(`/ticket/${orderData.booking_code ?? `ORD-${String(orderData.id).padStart(8, "0")}`}`)}
                >
                  📄 Lihat Tiket
                </button>
              )}
              <button type="button" className="resultModal__closeBtn" onClick={() => { setIsPaidOpen(false); document.body.style.overflow = "auto"; }}>
                Selesai
              </button>
              <p className="resultModal__support">
                Untuk bantuan, hubungi kami di <a href="mailto:noreply@desamanudjaya.com">noreply@desamanudjaya.com</a>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── FAILED MODAL ── */}
      {isFailedOpen && orderData && (
        <div className="resultModal__overlay" onClick={() => { setIsFailedOpen(false); document.body.style.overflow = "auto"; }}>
          <div className="resultModal resultModal--failed" onClick={(e) => e.stopPropagation()}>
            <div className="resultModal__hero resultModal__hero--failed">
              <div className="resultModal__icon">✕</div>
              <h2 className="resultModal__heroTitle">Pembayaran Gagal</h2>
              <p className="resultModal__heroSub">Waktu pembayaran telah habis</p>
            </div>
            <div className="resultModal__body">
              <div className="resultModal__bookingBox resultModal__bookingBox--failed">
                <div className="resultModal__bookingLabel">KODE BOOKING</div>
                <div className="resultModal__bookingCode resultModal__bookingCode--failed">
                  {orderData.booking_code ?? `ORD-${String(orderData.id).padStart(8, "0")}`}
                </div>
              </div>
              <p className="resultModal__failedMsg">Hai <strong>{orderData.user_name || "Tamu"}</strong>,</p>
              <p className="resultModal__failedDesc">
                Pesanan Anda dengan kode <strong>{orderData.booking_code ?? orderData.id}</strong> untuk{" "}
                <strong>{orderData.order_item.name}</strong> telah dibatalkan karena pembayaran tidak diselesaikan dalam waktu yang ditentukan (10 menit).
              </p>
              <div className="resultModal__retryNote">
                📌 Ingin memesan lagi? Silakan buat pesanan baru melalui aplikasi kami. Ketersediaan kamar terbatas.
              </div>
              <div className="resultModal__section">
                <div className="resultModal__sectionTitle">Detail Pesanan</div>
                <div className="resultModal__row"><span>Kamar</span><strong>{orderData.order_item.name}</strong></div>
                <div className="resultModal__row"><span>Jumlah Malam</span><strong>{orderData.qty} Malam</strong></div>
                <div className="resultModal__row"><span>Total</span><strong>{formatRupiah(orderData.order_total)}</strong></div>
              </div>
              <button type="button" className="resultModal__closeBtn resultModal__closeBtn--failed"
                onClick={() => { setIsFailedOpen(false); document.body.style.overflow = "auto"; }}>
                Tutup
              </button>
              <p className="resultModal__support">
                Untuk bantuan, hubungi kami di <a href="mailto:noreply@desamanudjaya.com">noreply@desamanudjaya.com</a>. Email ini dikirim secara otomatis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
