import { Link } from "react-router-dom";
import { destinations } from "../../data/destinations";
import Reveal from "../../components/reveal";
import "./paket-wisata.css";

function formatRupiah(value: string) {
  return `Rp. ${Number(value).toLocaleString("id-ID")}`;
}

export default function PaketWisataPage() {
  return (
    <div className="paketPage">
      <section className="paketHero">
        <h1 className="paketHero__title">PAKET WISATA</h1>
        <div className="paketHero__underline" />
      </section>

      <section className="paketSection">
        <div className="paketGrid">
          {destinations.map((item, index) => (
            <Reveal key={item.id} delay={index * 100}>
              <article className="paketCard">
              <div className="paketCard__thumb">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="paketCard__thumbImage"
                />
                <button
                  className="paketCard__fav"
                  type="button"
                  aria-label="favorit"
                >
                  ☆
                </button>
              </div>

              <div className="paketCard__body">
                <div className="paketCard__metaTop">
                  <div className="paketCard__paketNo">
                    {item.category.name.toUpperCase()}
                  </div>
                  <div className="paketCard__title">{item.name}</div>
                </div>

                <div className="paketCard__metaMid">
                  <div className="paketCard__line">{item.date}</div>
                  <div className="paketCard__lineMuted">
                    {item.start_time} - {item.end_time}
                  </div>
                </div>

                <div className="paketCard__bottom">
                  <div className="paketCard__price">
                    <span className="paketCard__priceIcon">💚</span>
                    {formatRupiah(item.price)}
                  </div>

                  <Link
                    to={`/paket-wisata/${item.id}`}
                    className="paketCard__btn"
                  >
                    Selengkapnya
                  </Link>
                </div>
              </div>
            </article>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}