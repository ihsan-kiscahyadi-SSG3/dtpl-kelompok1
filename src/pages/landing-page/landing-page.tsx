import "./landing-page.css";
import Reveal from "../../components/reveal";
import { destinations } from "../../data/destinations";
import { useMemo, useState } from "react";

type Category = {
  label: string;
  image: string;
};

const categories: Category[] = [
  {
    label: "Kerajinan",
    image:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=600&auto=format&fit=crop",
  },
  {
    label: "Kulineran",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop",
  },
  {
    label: "Keliling Desa",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop",
  },
  {
    label: "Kesenian",
    image:
      "https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=600&auto=format&fit=crop",
  },
  {
    label: "Atraksi",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop",
  },
  {
    label: "Outbond",
    image:
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=600&auto=format&fit=crop",
  },
];

const popularEvents = [
  {
    tag: "Kerajinan",
    title: "Temukan Kerajinan Desa",
  },
  {
    tag: "Kesenian & Budaya",
    title: "Nikmati Kesenian & Budaya",
  },
  {
    tag: "Atraksi",
    title: "Pesona Alam Desa",
  },
  {
    tag: "Atraksi",
    title: "Jelajahi Sejarah & Budaya",
  },
  {
    tag: "Kulineran",
    title: "Lezatnya Kuliner Desa",
  },
  {
    tag: "Keliling Desa",
    title: "Temukan pesona setiap sudut desa",
  },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const filteredDestinations = useMemo(() => {
    if (activeCategory === "Semua") {
      return destinations;
    }

    return destinations.filter((item) => item.category.name === activeCategory);
  }, [activeCategory]);
  const displayedDestinations = filteredDestinations.slice(0, 6);
  return (
    <div className="page">
      {/* HERO */}
      <main id="beranda" className="hero">
        <div className="hero__inner container">
          <Reveal variant="left" className="hero__content">
            <div className="hero__kicker">DESA WISATA MANUD JAYA</div>

            <h1 className="hero__title">
              ALAM, BUDAYA, SENI,
              <br />
              DAN KERAJINAN
            </h1>

            <p className="hero__desc">
              Selamat datang di Desa Manud Jaya, tempat kreativitas bertemu
              alam! Dari UMKM inovatif hingga pesona pertanian dan wisata yang
              membuka, desa ini penuh peluang. Meski menghadapi tantangan
              pasca-pandemi dan kesadaran lingkungan yang perlu ditingkatkan,
              semangat warganya membara untuk membangun masa depan bersama.
            </p>

            <button className="btn btn--cta">Jelajahi Destinasi</button>
          </Reveal>

          <Reveal variant="right" className="hero__media">
            <div className="hero__imageWrap">
              <img
                className="hero__image"
                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop"
                alt="Pemandangan desa wisata"
                loading="lazy"
              />
              <div className="hero__imageGlow" aria-hidden="true" />
            </div>
          </Reveal>
        </div>
      </main>

      {/* CATEGORY */}
      <section className="section container">
        <Reveal>
          <h2 className="section__title">Jelajahi Kategori</h2>
        </Reveal>

        <div className="categories">
          <Reveal delay={0}>
            <button
              className={`cat ${activeCategory === "Semua" ? "cat--active" : ""}`}
              type="button"
              onClick={() => setActiveCategory("Semua")}
            >
              <div className="cat__circle" aria-hidden="true">
                <div className="cat__all">All</div>
              </div>
              <div className="cat__label">Semua</div>
            </button>
          </Reveal>

          {categories.map((c, index) => (
            <Reveal key={c.label} delay={(index + 1) * 100}>
              <button
                className={`cat ${activeCategory === c.label ? "cat--active" : ""}`}
                type="button"
                onClick={() => setActiveCategory(c.label)}
              >
                <div className="cat__circle" aria-hidden="true">
                  <img
                    src={c.image}
                    alt={c.label}
                    className="cat__image"
                    loading="lazy"
                  />
                </div>
                <div className="cat__label">{c.label}</div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* POPULAR EVENTS */}
      <section className="section container">
        <div className="popular">
          <Reveal>
            <div className="popular__header">
              <span className="popular__subtitle">Popular events</span>
              <h2 className="popular__title">
                Kegiatan Populer
                {activeCategory !== "Semua" ? ` - ${activeCategory}` : ""}
              </h2>
            </div>
          </Reveal>

          <div className="eventGrid">
            {displayedDestinations.length > 0 ? (
              displayedDestinations.map((item, i) => (
                <Reveal
                  key={item.id}
                  delay={i * 120}
                  variant={i % 2 === 0 ? "left" : "right"}
                >
                  <div className="eventCard">
                    <div className="eventCard__image">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="eventCard__imageTag"
                      />
                      <span className="eventCard__fav">★</span>
                    </div>

                    <div className="eventCard__body">
                      <span className="eventCard__tag">
                        {item.category.name}
                      </span>

                      <div className="eventCard__meta">
                        <div className="eventCard__date">
                          <span className="eventCard__month">
                            {new Date(item.date)
                              .toLocaleDateString("id-ID", { month: "short" })
                              .toUpperCase()}
                          </span>
                          <span className="eventCard__day">
                            {new Date(item.date).getDate()}
                          </span>
                        </div>

                        <div className="eventCard__info">
                          <h3 className="eventCard__title">{item.name}</h3>
                          <div className="eventCard__venue">
                            {item.category.name}
                          </div>
                          <div className="eventCard__time">
                            {item.start_time} - {item.end_time}
                          </div>
                          <div className="eventCard__price">
                            Rp. {Number(item.price).toLocaleString("id-ID")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))
            ) : (
              <Reveal>
                <div className="emptyState">
                  Belum ada destinasi untuk kategori {activeCategory}.
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
