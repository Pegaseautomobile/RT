const SUPABASE_URL = "https://lkuptpgposnungotdsbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_AWd0zD__eW-fZ4R-gzyhTw_82mwVbSk";

const API = `${SUPABASE_URL}/rest/v1/cars`;

let allCars = [];

/* =========================
   CHARGER LES VOITURES
========================= */

async function getCars() {
  try {
    const response = await fetch(API, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return await response.json();

  } catch (error) {
    console.error("Erreur Supabase :", error);
    return [];
  }
}

/* =========================
   AFFICHER LES VOITURES
========================= */

async function render() {

  const q = (
    document.querySelector("#search")?.value || ""
  ).toLowerCase();

  const f =
    document.querySelector("#fuel")?.value || "";

  allCars = await getCars();

  const list = allCars.filter(car =>
    `${car.brand} ${car.model}`
      .toLowerCase()
      .includes(q) &&
    (!f || car.fuel === f)
  );

  const box = document.querySelector("#cars");

  if (!box) return;

  box.innerHTML = list.map(car => {

    const photos =
      Array.isArray(car.photos)
        ? car.photos.filter(Boolean)
        : [];

    const firstPhoto =
      photos.length > 0
        ? photos[0]
        : "";

    return `
      <article
        class="car"
        data-car-id="${esc(car.id)}"
        style="cursor:pointer;"
      >

        <div
          class="car-img"
          style="
            position:relative;
            overflow:hidden;
          "
        >

          ${
            firstPhoto
              ? `
                <img
                  src="${esc(firstPhoto)}"
                  alt="${esc(car.brand)} ${esc(car.model)}"
                  style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    display:block;
                  "
                >

                ${
                  photos.length > 1
                    ? `
                      <div style="
                        position:absolute;
                        bottom:10px;
                        right:10px;
                        background:rgba(0,0,0,.75);
                        color:white;
                        padding:6px 10px;
                        border-radius:20px;
                        font-size:13px;
                      ">
                        📷 ${photos.length} photos
                      </div>
                    `
                    : ""
                }
              `
              : `
                <div style="
                  width:100%;
                  height:100%;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  background:#111;
                  color:#aaa;
                ">
                  Aucune photo
                </div>
              `
          }

        </div>

        <div class="car-body">

          <h3>
            ${esc(car.brand)} ${esc(car.model)}
          </h3>

          <div class="price">
            ${esc(car.price)}
          </div>

          <div class="meta">
            <span>${esc(car.year)}</span>
            <span>${esc(car.km)}</span>
            <span>${esc(car.fuel)}</span>
            <span>${esc(car.gear || "")}</span>
          </div>

          <p>
            ${esc(car.description || "")}
          </p>

          <a
            class="btn green call"
            href="tel:+33643486124"
            onclick="event.stopPropagation()"
          >
            📞 Mettre en relation avec le vendeur
          </a>

        </div>

      </article>
    `;

  }).join("");

  /* =========================
     CLIC SUR L'ANNONCE ENTIÈRE
  ========================= */

  document
    .querySelectorAll(".car")
    .forEach(card => {

      card.addEventListener("click", event => {

        /*
          Si on clique sur le bouton téléphone,
          on ne change pas de page.
        */
        if (
          event.target.closest("a") ||
          event.target.closest("button")
        ) {
          return;
        }

        const id =
          card.dataset.carId;

        if (!id) return;

        window.location.href =
          `voiture.html?id=${encodeURIComponent(id)}`;

      });

    });

  const empty =
    document.querySelector("#empty");

  if (empty) {
    empty.hidden = list.length > 0;
  }
}

/* =========================
   PROTECTION DU TEXTE
========================= */

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );
}

/* =========================
   RECHERCHE
========================= */

document
  .querySelector("#search")
  ?.addEventListener("input", render);

/* =========================
   FILTRE CARBURANT
========================= */

document
  .querySelector("#fuel")
  ?.addEventListener("change", render);

/* =========================
   ANNÉE
========================= */

const year =
  document.querySelector("#year");

if (year) {
  year.textContent =
    new Date().getFullYear();
}

/* =========================
   LANCEMENT
========================= */

render();
