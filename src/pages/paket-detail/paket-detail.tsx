import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getDestinationById } from "../../services/api";
import type { DestinationDetail } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Reveal from "../../components/reveal";
import "./paket-detail.css";
import logo from "../../assets/logo.png";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop";

type VisitorForm = {
  fullName: string;
  email: string;
  phone: string;
};

function formatRupiah(value: string | number) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
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

export default function PaketDetailPage() {
  const { id } = useParams();
  // const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [destination, setDestination] = useState<DestinationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [orderId] = useState(() => `${Date.now()}`);
  const [bookingTime] = useState(() => new Date());
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState<VisitorForm>({
    fullName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDestinationById(id)
      .then((data) => {
        setDestination(data);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  const ticketName = "Tiket Standard";
  const ticketPrice = Number(destination?.price ?? 0);
  const tax = 20000;

  const total = useMemo(() => qty * ticketPrice, [qty, ticketPrice]);
  const grandTotal = useMemo(() => total + tax, [total]);

  const openModal = () => {
    setStep(1);
    setQty(1);
    setForm({ fullName: "", email: "", phone: "" });
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

  const decreaseQty = () => setQty((prev) => Math.max(0, prev - 1));
  const increaseQty = () => setQty((prev) => prev + 1);

  const handleNextFromStep1 = () => {
    if (qty < 1) return;
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (!form.fullName || !form.email || !form.phone) {
      alert("Mohon lengkapi data pengunjung dulu ya.");
      return;
    }
    setStep(3);
  };

  const handlePayNow = () => {
    setIsModalOpen(false);
    setIsReceiptOpen(true);
  };

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
                        <span>
                          {destination.start_time} - {destination.end_time}
                        </span>
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
                    <p className="paketDetail__paragraph">
                      {destination.descriptions}
                    </p>
                  </section>
                </Reveal>
              </div>

              <aside className="paketDetail__right">
                <Reveal variant="right">
                  <button
                    className="paketDetail__fav"
                    type="button"
                    aria-label="Favorit"
                  >
                    ♡
                  </button>
                </Reveal>

                <Reveal variant="right">
                  {isLoggedIn ? (
                    <button
                      type="button"
                      className="paketDetail__orderBtn"
                      onClick={openModal}
                    >
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

      {isModalOpen && (
        <div className="bookingModal__overlay" onClick={closeModal}>
          <div className="bookingModal" onClick={(e) => e.stopPropagation()}>
            {step === 1 && (
              <>
                <div className="bookingModal__header">
                  <h2 className="bookingModal__title">Pilih tiket</h2>
                  <button
                    type="button"
                    className="bookingModal__close"
                    onClick={closeModal}
                  >
                    ✕
                  </button>
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
                        <div className="ticketItem__price">
                          {formatRupiah(ticketPrice)}
                        </div>
                      </div>

                      <div className="ticketQty">
                        <button type="button" onClick={decreaseQty}>
                          −
                        </button>
                        <span>{qty}</span>
                        <button type="button" onClick={increaseQty}>
                          ＋
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bookingModal__footer">
                  <div className="bookingSummary">
                    <span>
                      Qty: <strong>{qty}</strong>
                    </span>
                    <span>
                      Total:{" "}
                      <strong className="text-green">
                        {formatRupiah(total)}
                      </strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    className="bookingPrimaryBtn"
                    onClick={handleNextFromStep1}
                    disabled={qty < 1}
                  >
                    Process Pembayaran <span>›</span>
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="bookingModal__header">
                  <button
                    type="button"
                    className="bookingModal__back"
                    onClick={() => setStep(1)}
                  >
                    ←
                  </button>
                  <h2 className="bookingModal__title">Detail Pengunjung</h2>
                  <button
                    type="button"
                    className="bookingModal__close"
                    onClick={closeModal}
                  >
                    ✕
                  </button>
                </div>

                <div className="bookingModal__body bookingModal__body--gray">
                  <div className="visitorTop">
                    <div>
                      <div className="visitorTop__event">{destination.name}</div>
                      <div className="visitorTop__ticket">
                        {ticketName}: Tiket #1
                      </div>
                    </div>
                    <div className="visitorTop__date">
                      📅 {formatDateIndonesia(destination.date)}
                    </div>
                  </div>

                  <div className="visitorFormCard">
                    <label className="visitorField">
                      <span>Nama Lengkap</span>
                      <input
                        type="text"
                        placeholder="Masukkan Nama Lengkap"
                        value={form.fullName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            fullName: e.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="visitorField">
                      <span>Alamat Email</span>
                      <input
                        type="email"
                        placeholder="Masukkan Alamat Email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="visitorField">
                      <span>Nomor Hp</span>
                      <div className="phoneField">
                        <span className="phoneField__prefix">🇮🇩</span>
                        <input
                          type="text"
                          placeholder="Masukkan Nomor Handphone"
                          value={form.phone}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bookingModal__footer">
                  <div className="bookingSummary">
                    <span>
                      Qty: <strong>{qty}</strong>
                    </span>
                    <span>
                      Total:{" "}
                      <strong className="text-green">
                        {formatRupiah(total)}
                      </strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    className="bookingPrimaryBtn bookingPrimaryBtn--muted"
                    onClick={handleNextFromStep2}
                  >
                    Lanjutkan Pembayaran <span>›</span>
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="bookingModal__header">
                  <button
                    type="button"
                    className="bookingModal__back"
                    onClick={() => setStep(2)}
                  >
                    ←
                  </button>
                  <h2 className="bookingModal__title">Ringkasan Pesanan</h2>
                  <button
                    type="button"
                    className="bookingModal__close"
                    onClick={closeModal}
                  >
                    ✕
                  </button>
                </div>

                <div className="bookingModal__body bookingModal__body--gray bookingModal__body--summary">
                  <div className="ticketSummaryCard">
                    <div className="ticketSummaryCard__title">{ticketName}</div>
                    <div className="ticketSummaryCard__content">
                      <div>
                        <div className="ticketSummaryCard__label">
                          Nama Pengunjung
                        </div>
                        <div className="ticketSummaryCard__value">
                          {form.fullName}
                        </div>
                        <div className="ticketSummaryCard__value">
                          {form.email}
                        </div>
                      </div>
                      <div className="ticketSummaryCard__badge">
                        {formatRupiah(ticketPrice)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bookingModal__footer bookingModal__footer--summary">
                  <div className="paymentSummary">
                    <div className="paymentSummary__row">
                      <span>Sub Total:</span>
                      <strong>{formatRupiah(total)}</strong>
                    </div>
                    <div className="paymentSummary__row">
                      <span>Tax:</span>
                      <strong>{formatRupiah(tax)}</strong>
                    </div>
                    <div className="paymentSummary__divider" />
                    <div className="paymentSummary__row paymentSummary__row--grand">
                      <span>Order Total:</span>
                      <strong className="text-green">
                        {formatRupiah(grandTotal)}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="bookingPayBtn"
                    onClick={handlePayNow}
                  >
                    🔒 Bayar Sekarang
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isReceiptOpen && (
        <div className="receiptModal__overlay" onClick={closeReceipt}>
          <div className="receiptModal" onClick={(e) => e.stopPropagation()}>
            <div className="receiptModal__header">
              <button
                type="button"
                className="receiptModal__close"
                onClick={closeReceipt}
              >
                ✕
              </button>
            </div>

            <div className="receiptModal__logoWrap">
              <img className="receipt__logo" src={logo} alt="Logo" />
            </div>

            <h1 className="receiptModal__title">Bukti Pembayaran Tiket</h1>

            <div className="receiptModal__meta">
              <div className="receiptModal__date">
                {formatReceiptDate(bookingTime)}
              </div>
              <div className="receiptModal__orderId">Order ID: {orderId}</div>
            </div>

            <div className="receiptTicket">
              <div className="receiptTicket__topLine" />

              <div className="receiptTicket__type">{ticketName}</div>

              <div className="receiptTicket__content">
                <div className="receiptTicket__left">
                  <div className="receiptTicket__destination">
                    {destination.name}
                  </div>
                  <div className="receiptTicket__visitor">{form.fullName}</div>
                  <div className="receiptTicket__visitor">{form.email}</div>
                  <div className="receiptTicket__visitor">{form.phone}</div>
                </div>

                <div className="receiptTicket__qrWrap">
                  <img
                    className="receiptTicket__qr"
                    alt="QR Code Tiket"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      JSON.stringify({
                        orderId,
                        destination: destination.name,
                        visitor: form.fullName,
                        email: form.email,
                        phone: form.phone,
                        qty,
                        total: grandTotal,
                      }),
                    )}`}
                  />
                </div>
              </div>

              <div className="receiptTicket__bottomLine" />
            </div>

            <div className="receiptModal__infoRow">
              <div>
                <div className="receiptModal__label">Metode Pembayaran</div>
                <div className="receiptModal__label">Waktu Pemesanan</div>
              </div>

              <div className="receiptModal__infoRight">
                <div className="receiptModal__paymentMethod">BCA</div>
                <div className="receiptModal__bookingTime">
                  {formatReceiptDateTime(bookingTime)}
                </div>
              </div>
            </div>

            <div className="receiptModal__summaryWrap">
              <div className="receiptSummary">
                <div className="receiptSummary__row">
                  <span>Sub Total:</span>
                  <strong>{formatRupiah(total)}</strong>
                </div>

                <div className="receiptSummary__row">
                  <span>Tax:</span>
                  <strong>{formatRupiah(tax)}</strong>
                </div>

                <div className="receiptSummary__divider" />

                <div className="receiptSummary__row receiptSummary__row--grand">
                  <span>Order Total:</span>
                  <strong className="text-green">
                    {formatRupiah(grandTotal)}
                  </strong>
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
              membaca, memahami, dan menyetujui seluruh syarat dan ketentuan
              ini.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
