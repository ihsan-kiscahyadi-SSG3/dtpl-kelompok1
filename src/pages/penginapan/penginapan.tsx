import { useState, useEffect } from "react";
import {
  getAccommodations,
  createOrder,
  updateOrder,
  createOrderVisitorDetails,
} from "../../services/api";
import type { Accommodation, OrderResponse } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Reveal from "../../components/reveal";
import "./penginapan.css";
import logo from "../../assets/logo.png";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=600&auto=format&fit=crop";

type VisitorForm = { name: string; email: string; phone_number: string };

function formatRupiah(value: string | number) {
  return `Rp ${Number(value).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatReceiptDate(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
function formatReceiptDateTime(d: Date) {
  return `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}
function emptyVisitor(): VisitorForm {
  return { name: "", email: "", phone_number: "" };
}

export default function PenginapanPage() {
  const { isLoggedIn } = useAuth();

  const [rooms, setRooms] = useState<Accommodation[]>([]);

  // modal state
  const [selectedRoom, setSelectedRoom] = useState<Accommodation | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [qty, setQty] = useState(1);
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [visitor, setVisitor] = useState<VisitorForm>(emptyVisitor());
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentDeadline, setPaymentDeadline] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [bookingTime] = useState(() => new Date());

  useEffect(() => {
    getAccommodations().then(setRooms).catch(() => { });
  }, []);
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
  const ticketPrice = Number(selectedRoom?.price ?? 0);
  const localSubTotal = qty * ticketPrice;
  const subTotal = orderData ? Number(orderData.sub_total) : localSubTotal;
  const taxAmount = orderData ? Number(orderData.tax) : 0;
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
    setSelectedRoom(selectedRoom);
    setStep(3);
    document.body.style.overflow = "hidden";
  };

  const handleCheckPaymentStatus = () => {
    setIsPaymentOpen(false);
    setIsReceiptOpen(true);
  };
  const closeReceipt = () => {
    setIsReceiptOpen(false);
    document.body.style.overflow = "auto";
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
        res = await createOrder({
          ticket_id: selectedRoom.id,
          ticket_type: "accommodation",
          qty,
        });
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

  const handlePayNow = () => {
    setTimeLeft(15 * 60);
    setPaymentDeadline(Date.now() + 15 * 60 * 1000);
    setIsPaymentOpen(true);
    setSelectedRoom(null);
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
                      {room.image_url ? (
                        <img
                          src={room.image_url}
                          alt={room.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <img
                          src={FALLBACK_IMAGE}
                          alt={room.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="roomCard__detail">
                    <h3 className="roomCard__subtitle">Fasilitas:</h3>
                    <ul className="roomCard__list">
                      {room.facilities.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="roomCard__divider" />
                <div className="roomCard__price">{formatRupiah(room.price)} / Malam</div>

                {isLoggedIn ? (
                  <button
                    className="roomCard__button"
                    type="button"
                    onClick={() => openModal(room)}
                  >
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
                  <button
                    type="button"
                    className="bookingPrimaryBtn"
                    onClick={handleNextFromStep1}
                    disabled={submitting}
                  >
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
                      <input
                        type="text"
                        placeholder="Masukkan Nama Lengkap"
                        value={visitor.name}
                        onChange={(e) => setVisitor((v) => ({ ...v, name: e.target.value }))}
                      />
                    </label>
                    <label className="visitorField">
                      <span>Alamat Email</span>
                      <input
                        type="email"
                        placeholder="Masukkan Alamat Email"
                        value={visitor.email}
                        onChange={(e) => setVisitor((v) => ({ ...v, email: e.target.value }))}
                      />
                    </label>
                    <label className="visitorField">
                      <span>Nomor Hp</span>
                      <div className="phoneField">
                        <span className="phoneField__prefix">🇮🇩</span>
                        <input
                          type="text"
                          placeholder="Masukkan Nomor Handphone"
                          value={visitor.phone_number}
                          onChange={(e) => setVisitor((v) => ({ ...v, phone_number: e.target.value }))}
                        />
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
                    room: orderData.order_item.name,
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
            <h1 className="receiptModal__title">Bukti Pembayaran</h1>
            <div className="receiptModal__meta">
              <div className="receiptModal__date">{formatReceiptDate(bookingTime)}</div>
              <div className="receiptModal__orderId">Order ID: {orderData.id}</div>
            </div>

            {orderData.order_visitor_details.map((v) => (
              <div key={v.id} className="receiptTicket">
                <div className="receiptTicket__topLine" />
                <div className="receiptTicket__type">{orderData.order_item.name}</div>
                <div className="receiptTicket__content">
                  <div className="receiptTicket__left">
                    <div className="receiptTicket__destination">{orderData.order_item.name} · {qty} malam</div>
                    <div className="receiptTicket__visitor">{v.name}</div>
                    <div className="receiptTicket__visitor">{v.email}</div>
                    <div className="receiptTicket__visitor">{v.phone_number}</div>
                  </div>
                  <div className="receiptTicket__qrWrap">
                    <img
                      className="receiptTicket__qr"
                      alt="QR Code"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                        JSON.stringify({ orderId: orderData.id, room: orderData.order_item.name, guest: v.name, email: v.email })
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
                  <span>Sub Total:</span><strong>{formatRupiah(subTotal)}</strong>
                </div>
                <div className="receiptSummary__row">
                  <span>Tax:</span><strong>{formatRupiah(taxAmount)}</strong>
                </div>
                <div className="receiptSummary__divider" />
                <div className="receiptSummary__row receiptSummary__row--grand">
                  <span>Order Total:</span>
                  <strong className="text-green">{formatRupiah(grandTotal)}</strong>
                </div>
              </div>
            </div>

            <p className="receiptModal__note">
              Struk ini merupakan bukti sah pemesanan kamar dan wajib disimpan oleh tamu.
              Kamar hanya berlaku sesuai detail yang tertera dan tidak dapat dipindah tangankan
              tanpa persetujuan. Dengan melakukan pemesanan, tamu dianggap telah menyetujui
              seluruh syarat dan ketentuan yang berlaku.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
