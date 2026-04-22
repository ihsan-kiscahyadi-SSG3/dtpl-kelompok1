import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AdminSidebar from "../../components/admin-sidebar";
import {
  createDestination,
  updateDestination,
  deleteDestination,
  uploadImage,
  getDestinationById,
  getDestinations,
  getCategories,
  type Category,
  type Destination,
  type DestinationDetail,
} from "../../services/api";
import "./admin-destination-list.css";
import "./admin-shared.css";
import { useNavigate } from "react-router-dom";

// Fix Leaflet default marker icons broken by Vite bundling
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadow,
});

const TICKET_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "price_per_ticket", label: "Price per Ticket" },
  // { value: "event", label: "Event" },
  // { value: "tour", label: "Tur" },
];

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

function parseCurrencyInput(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

type DestinationForm = {
  name: string;
  category_id: string;
  price: string;        // raw digits, e.g. "50000"
  descriptions: string;
  date: string;         // YYYY-MM-DD
  start_time: string;   // HH:MM
  end_time: string;     // HH:MM
  latitude: string;
  longitude: string;
  ticket_type: string;
  image_url: string;
};

function emptyForm(): DestinationForm {
  return {
    name: "",
    category_id: "",
    price: "",
    descriptions: "",
    date: "",
    start_time: "",
    end_time: "",
    latitude: "",
    longitude: "",
    ticket_type: "price_per_ticket",
    image_url: "",
  };
}

/* ── Map Picker ─────────────────────────────────────────────────────────── */
type MapPickerProps = {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
};

function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  const hasCoords = !isNaN(parsedLat) && !isNaN(parsedLng);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = hasCoords
      ? [parsedLat, parsedLng]
      : [-7.983908, 112.621391]; // default: East Java, Indonesia

    const map = L.map(containerRef.current).setView(center, hasCoords ? 14 : 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    if (hasCoords) {
      markerRef.current = L.marker(center).addTo(map);
    }

    map.on("click", (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      const latStr = clickLat.toFixed(7);
      const lngStr = clickLng.toFixed(7);
      onChange(latStr, lngStr);
      if (markerRef.current) {
        markerRef.current.setLatLng([clickLat, clickLng]);
      } else {
        markerRef.current = L.marker([clickLat, clickLng]).addTo(map);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker when lat/lng change externally (manual input)
  useEffect(() => {
    if (!mapRef.current) return;
    if (!hasCoords) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([parsedLat, parsedLng]);
    } else {
      markerRef.current = L.marker([parsedLat, parsedLng]).addTo(mapRef.current);
    }
    mapRef.current.setView([parsedLat, parsedLng], mapRef.current.getZoom());
  }, [lat, lng, hasCoords, parsedLat, parsedLng]);

  return (
    <div
      ref={containerRef}
      className="destinationMap"
    />
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function AdminDestinasiPage() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [form, setForm] = useState<DestinationForm>(emptyForm());
  // const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchDestinations = async () => {
    setLoadingList(true);
    setListError("");
    try {
      const data = await getDestinations();
      setDestinations(data);
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : "Gagal mengambil data destinasi.",
      );
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  useEffect(() => {
    if (!isAddModalOpen) return;
    setLoadingCategories(true);
    getCategories()
      .then((data) => setCategories(data))
      .catch(() => setApiError("Gagal mengambil data kategori."))
      .finally(() => setLoadingCategories(false));
  }, [isAddModalOpen]);

  useEffect(() => {
    if (!isAddModalOpen) {
      document.body.style.overflow = "auto";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isAddModalOpen]);

  const openAddModal = () => {
    setModalMode("create");
    setEditingId(null);
    setApiError("");
    setForm(emptyForm());
    // setImageFile(null);
    setImagePreview("");
    setIsAddModalOpen(true);
  };

  const openEditModal = async (id: number) => {
    setModalMode("edit");
    setEditingId(id);
    setApiError("");
    setLoadingDetail(true);
    setIsAddModalOpen(true);
    try {
      const detail: DestinationDetail = await getDestinationById(id);
      setForm({
        name: detail.name ?? "",
        category_id: String(detail.category?.id ?? detail.category_id ?? ""),
        price: String(detail.price ?? "").replace(/\D/g, ""),
        descriptions: detail.descriptions ?? "",
        date: detail.date ?? "",
        start_time: detail.start_time ?? "",
        end_time: detail.end_time ?? "",
        latitude: String(detail.latitude ?? ""),
        longitude: String(detail.longitude ?? ""),
        ticket_type: detail.ticket_type ?? "price_per_ticket",
        image_url: detail.image_url ?? "",
      });
      // setImageFile(null);
      setImagePreview(detail.image_url ?? "");
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Gagal mengambil detail destinasi.",
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async () => {
    setApiError("");
    if (
      !form.name ||
      !form.category_id ||
      !form.price ||
      !form.descriptions ||
      !form.date ||
      !form.start_time ||
      !form.end_time ||
      !form.latitude ||
      !form.longitude ||
      !form.ticket_type
    ) {
      setApiError("Mohon lengkapi seluruh field.");
      return;
    }
    setSubmitting(true);
    const payload = {
      name: form.name,
      category_id: Number(form.category_id),
      price: Number(form.price),
      descriptions: form.descriptions,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      ticket_type: form.ticket_type,
      image_url: form.image_url,
    };
    try {
      if (modalMode === "edit" && editingId) {
        await updateDestination(editingId, payload);
      } else {
        await createDestination(payload);
      }
      closeAddModal();
      await fetchDestinations();
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : modalMode === "edit"
            ? "Gagal memperbarui destinasi."
            : "Gagal menambahkan destinasi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number | null) => {
    if (!id) return;
    if (!window.confirm("Hapus destinasi ini?")) return;
    try {
      await deleteDestination(id);
      closeAddModal();
      await fetchDestinations();
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Gagal menghapus destinasi.",
      );
    }
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setApiError("");
  };

  const handleChange = (field: keyof DestinationForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async (file: File | null) => {
    if (!file) return;
    // setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    try {
      const uploadedUrl = await uploadImage(file);
      setForm((prev) => ({ ...prev, image_url: uploadedUrl }));
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
      setImagePreview(form.image_url || "");
      // setImageFile(null);
    }
  };

  const handleMapClick = (lat: string, lng: string) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  return (
    <div className="adminPage">
      <div className="adminShell">
        <AdminSidebar />

        <main className="adminContent">
          <div className="adminContent__topbar">
            <h1 className="adminContent__title">Destinasi</h1>
            <button
              type="button"
              className="adminContent__addButton"
              onClick={openAddModal}
            >
              Tambah Destinasi
            </button>
          </div>

          {listError && (
            <div className="destinationModal__error">{listError}</div>
          )}

          <section className="adminDestinationGrid">
            {loadingList ? (
              <div>Memuat...</div>
            ) : destinations.length === 0 ? (
              <div>Belum ada destinasi.</div>
            ) : (
              destinations.map((item) => (
                <article key={item.id} className="adminDestinationCard">
                  <button
                    type="button"
                    className="adminDestinationCard__editBtn"
                    onClick={() => openEditModal(item.id)}
                    aria-label="edit destinasi"
                    title="Edit destinasi"
                  >
                    ✎
                  </button>

                  <div className="adminDestinationCard__imageWrap">
                    <div className="adminDestinationCard__image">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="adminDestinationCard__uploadPreview"
                        />
                      ) : (
                        <span className="adminDestinationCard__placeholder">🖼</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="adminDestinationCard__fav"
                      aria-label="favorite"
                    >
                      ☆
                    </button>
                  </div>

                  <div className="adminDestinationCard__body">
                    <div className="adminDestinationCard__title">{item.name}</div>
                    <div className="adminDestinationCard__category">{item.category_name}</div>
                    <div className="adminDestinationCard__meta">{item.date}</div>
                    <div className="adminDestinationCard__time">
                      {item.start_time} - {item.end_time}
                    </div>
                    <div className="adminDestinationCard__price">
                      💚 {formatRupiah(Number(item.price))}
                    </div>
                    <button
                      type="button"
                      className="adminDestinationCard__button"
                      onClick={() =>
                        navigate(`/admin/destinasi/${item.id}/pembeli`, {
                          state: { name: `${item.name} ${item.category_name}` },
                        })
                      }
                    >
                      Lihat Data Pembeli
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>

          {isAddModalOpen && (
            <div className="destinationModal__overlay" onClick={closeAddModal}>
              <div
                className="destinationModal"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="destinationModal__close"
                  onClick={closeAddModal}
                >
                  ✕
                </button>

                {/* Image upload */}
                <div className="destinationModal__uploadWrap">
                  <label className="destinationModal__uploadCircle">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="destinationModal__uploadPreview"
                      />
                    ) : (
                      <span className="destinationModal__uploadIcon">📷</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="destinationModal__fileInput"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        e.target.value = "";
                        handleImageChange(file);
                      }}
                    />
                  </label>
                  <div className="destinationModal__heading">
                    <div className="destinationModal__uploadText">Unggah Foto</div>
                  </div>
                </div>

                {/* Form grid */}
                <div className="destinationModal__grid">
                  {/* ── Left column ── */}
                  <div className="destinationModal__left">
                    <div className="destinationFieldColumn">
                      <label className="destinationFieldColumn__label">Judul</label>
                      <input
                        type="text"
                        className="destinationFieldColumn__input"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Masukkan judul destinasi"
                      />
                    </div>

                    <div className="destinationFieldColumn">
                      <label className="destinationFieldColumn__label">Kategori</label>
                      <select
                        className="destinationFieldColumn__input"
                        value={form.category_id}
                        onChange={(e) => handleChange("category_id", e.target.value)}
                        disabled={loadingCategories}
                      >
                        <option value="">
                          {loadingCategories ? "Memuat kategori..." : "Pilih kategori"}
                        </option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="destinationFieldColumn">
                      <label className="destinationFieldColumn__label">Harga</label>
                      <div className="destinationCurrencyWrap">
                        <span className="destinationCurrencyPrefix">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="destinationFieldColumn__input destinationCurrencyInput"
                          value={formatCurrencyInput(form.price)}
                          onChange={(e) =>
                            handleChange("price", parseCurrencyInput(e.target.value))
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="destinationFieldColumn">
                      <label className="destinationFieldColumn__label">Tipe Tiket</label>
                      <select
                        className="destinationFieldColumn__input"
                        value={form.ticket_type}
                        onChange={(e) => handleChange("ticket_type", e.target.value)}
                      >
                        {TICKET_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* ── Right column ── */}
                  <div className="destinationModal__right">
                    <div className="destinationFieldColumn">
                      <label className="destinationFieldColumn__label">Deskripsi</label>
                      <textarea
                        className="destinationFieldColumn__textarea"
                        value={form.descriptions}
                        onChange={(e) => handleChange("descriptions", e.target.value)}
                        placeholder="Masukkan deskripsi"
                      />
                    </div>

                    <div className="destinationFieldColumn">
                      <label className="destinationFieldColumn__label">Tanggal</label>
                      <input
                        type="date"
                        className="destinationFieldColumn__input"
                        value={form.date}
                        onChange={(e) => handleChange("date", e.target.value)}
                      />
                    </div>

                    <div className="destinationFieldColumn">
                      <label className="destinationFieldColumn__label">Jam Mulai</label>
                      <input
                        type="time"
                        className="destinationFieldColumn__input"
                        value={form.start_time}
                        onChange={(e) => handleChange("start_time", e.target.value)}
                      />
                    </div>

                    <div className="destinationFieldColumn">
                      <label className="destinationFieldColumn__label">Jam Selesai</label>
                      <input
                        type="time"
                        className="destinationFieldColumn__input"
                        value={form.end_time}
                        onChange={(e) => handleChange("end_time", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Full-width map ── */}
                <div className="destinationFieldColumn destinationModal__mapSection">
                  <label className="destinationFieldColumn__label">
                    Lokasi di Peta
                    <span className="destinationMap__hint">— klik peta untuk mengisi koordinat</span>
                  </label>
                  <MapPicker
                    lat={form.latitude}
                    lng={form.longitude}
                    onChange={handleMapClick}
                  />
                </div>

                {apiError && (
                  <div className="destinationModal__error">{apiError}</div>
                )}

                <div className="destinationModal__actions">
                  <button
                    type="button"
                    className="destinationModal__saveBtn"
                    onClick={handleSubmit}
                    disabled={submitting || loadingDetail}
                  >
                    {loadingDetail
                      ? "Memuat..."
                      : submitting
                        ? modalMode === "edit"
                          ? "Mengupdate..."
                          : "Menyimpan..."
                        : modalMode === "edit"
                          ? "UPDATE"
                          : "SIMPAN"}
                  </button>

                  <button
                    type="button"
                    className="destinationModal__deleteBtn"
                    disabled={modalMode !== "edit" || submitting}
                    onClick={() => handleDelete(editingId)}
                  >
                    HAPUS
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
