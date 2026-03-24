export type DestinationItem = {
  id: number;
  name: string;
  date: string;
  descriptions: string;
  destination_type: string;
  start_time: string;
  end_time: string;
  image_url: string;
  latitude: string;
  longitude: string;
  price: string;
  ticket_type: string;
  category: {
    id: number;
    name: string;
    image_url: string | null;
  };
};

export const destinations: DestinationItem[] = [
  // ================= KERAJINAN =================
  {
    id: 1,
    name: "Workshop Kerajinan Bambu",
    date: "2026-06-10",
    descriptions:
      "Belajar membuat kerajinan dari bambu bersama pengrajin lokal.",
    destination_type: "single",
    start_time: "09:00",
    end_time: "12:00",
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    latitude: "-7.7956",
    longitude: "110.3695",
    price: "120000",
    ticket_type: "price_per_ticket",
    category: { id: 1, name: "Kerajinan", image_url: null },
  },
  {
    id: 2,
    name: "Membatik Tradisional",
    date: "2026-06-12",
    descriptions: "Pengalaman membatik langsung dengan teknik tradisional.",
    destination_type: "single",
    start_time: "10:00",
    end_time: "13:00",
    image_url: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    latitude: "-7.801",
    longitude: "110.364",
    price: "150000",
    ticket_type: "price_per_ticket",
    category: { id: 1, name: "Kerajinan", image_url: null },
  },

  // ================= KULINER =================
  {
    id: 3,
    name: "Wisata Kuliner Desa",
    date: "2026-06-15",
    descriptions: "Menikmati makanan khas desa langsung dari UMKM lokal.",
    destination_type: "single",
    start_time: "11:00",
    end_time: "14:00",
    image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    latitude: "-7.8",
    longitude: "110.37",
    price: "100000",
    ticket_type: "price_per_ticket",
    category: { id: 2, name: "Kulineran", image_url: null },
  },
  {
    id: 4,
    name: "Cooking Class Tradisional",
    date: "2026-06-16",
    descriptions: "Belajar memasak makanan khas desa bersama warga.",
    destination_type: "single",
    start_time: "09:00",
    end_time: "12:00",
    image_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f",
    latitude: "-7.79",
    longitude: "110.36",
    price: "180000",
    ticket_type: "price_per_ticket",
    category: { id: 2, name: "Kulineran", image_url: null },
  },

  // ================= KELILING DESA =================
  {
    id: 5,
    name: "Tour Sepeda Desa",
    date: "2026-06-18",
    descriptions: "Keliling desa dengan sepeda menikmati alam pedesaan.",
    destination_type: "single",
    start_time: "07:00",
    end_time: "10:00",
    image_url: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e",
    latitude: "-7.81",
    longitude: "110.38",
    price: "90000",
    ticket_type: "price_per_ticket",
    category: { id: 3, name: "Keliling Desa", image_url: null },
  },
  {
    id: 6,
    name: "Jelajah Sawah",
    date: "2026-06-19",
    descriptions: "Menjelajahi area persawahan bersama guide lokal.",
    destination_type: "single",
    start_time: "08:00",
    end_time: "11:00",
    image_url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    latitude: "-7.82",
    longitude: "110.37",
    price: "80000",
    ticket_type: "price_per_ticket",
    category: { id: 3, name: "Keliling Desa", image_url: null },
  },

  // ================= KESENIAN =================
  {
    id: 7,
    name: "Pertunjukan Tari Tradisional",
    date: "2026-06-20",
    descriptions: "Menikmati seni tari khas daerah.",
    destination_type: "single",
    start_time: "19:00",
    end_time: "21:00",
    image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    latitude: "-7.8",
    longitude: "110.35",
    price: "130000",
    ticket_type: "price_per_ticket",
    category: { id: 4, name: "Kesenian", image_url: null },
  },
  {
    id: 8,
    name: "Workshop Musik Tradisional",
    date: "2026-06-21",
    descriptions: "Belajar alat musik tradisional.",
    destination_type: "single",
    start_time: "15:00",
    end_time: "18:00",
    image_url: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc",
    latitude: "-7.79",
    longitude: "110.36",
    price: "140000",
    ticket_type: "price_per_ticket",
    category: { id: 4, name: "Kesenian", image_url: null },
  },

  // ================= ATRAKSI =================
  {
    id: 9,
    name: "Air Terjun Hidden Gem",
    date: "2026-06-22",
    descriptions: "Eksplorasi air terjun tersembunyi.",
    destination_type: "single",
    start_time: "08:00",
    end_time: "12:00",
    image_url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    latitude: "-7.83",
    longitude: "110.39",
    price: "160000",
    ticket_type: "price_per_ticket",
    category: { id: 5, name: "Atraksi", image_url: null },
  },
  {
    id: 10,
    name: "Sunrise View Point",
    date: "2026-06-23",
    descriptions: "Menikmati sunrise dari puncak bukit.",
    destination_type: "single",
    start_time: "05:00",
    end_time: "07:00",
    image_url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
    latitude: "-7.84",
    longitude: "110.40",
    price: "110000",
    ticket_type: "price_per_ticket",
    category: { id: 5, name: "Atraksi", image_url: null },
  },

  // ================= OUTBOUND =================
  {
    id: 11,
    name: "Outbound Team Building",
    date: "2026-06-24",
    descriptions: "Kegiatan seru untuk tim building.",
    destination_type: "group",
    start_time: "09:00",
    end_time: "15:00",
    image_url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
    latitude: "-7.85",
    longitude: "110.41",
    price: "200000",
    ticket_type: "price_per_ticket",
    category: { id: 6, name: "Outbond", image_url: null },
  },
  {
    id: 12,
    name: "Flying Fox Adventure",
    date: "2026-06-25",
    descriptions: "Uji adrenalin dengan flying fox.",
    destination_type: "single",
    start_time: "10:00",
    end_time: "14:00",
    image_url: "https://images.unsplash.com/photo-1500534623283-312aade485b7",
    latitude: "-7.86",
    longitude: "110.42",
    price: "170000",
    ticket_type: "price_per_ticket",
    category: { id: 6, name: "Outbond", image_url: null },
  },
];
