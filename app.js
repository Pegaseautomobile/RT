const SUPABASE_URL = "https://lkuptpgposnungotdsbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_AWd0zD__eW-fZ4R-gzyhTw_82mwVbSk";

const API = `${SUPABASE_URL}/rest/v1/cars`;

let allCars = [];

/* =========================
   RÉCUPÉRER LES VOITURES
========================= */

async function getCars() {
  try {
    const response = await fetch(
      `${API}?select=*`,
      {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const cars = await response.json();

    console.log("Voitures récupérées :", cars);

    return cars;

  } catch (error) {
    console.error("Erreur Supabase :", error);
    return [];
  }
}


/* =========================
   AFFICHER LES VOITURES
========================= */

async function render() {

  const searchInput = document.querySelector("#search");
  const fuelSelect = document.querySelector("#fuel");

  const q = (searchInput?.value || "").toLowerCase().trim();
  const f = fuelSelect?.value || "";

  allCars = await getCars();

  const list = allCars.filter(car => {

    const name = `${car.brand || ""} ${car.model || ""}`.toLowerCase();

    return (
      name.includes(q) &&
      (!f || car.fuel === f)
    );
  });

  const box = document.querySelector("#cars");

  if (!box) {
    console.error("Élément #cars introuvable dans index.html");
    return;
  }

  box.innerHTML = list.map(car => {

    /*
      Supabase peut parfois renvoyer photos sous forme
      de tableau OU de chaîne JSON.
      On gère les deux cas.
    */

    let photos = [];

    if (Array.isArray(car.photos)) {

      photos = car.photos.filter(Boolean);

    } else if (typeof car.photos === "string") {

      try {

        const parsed = JSON.parse(car.photos);

        if (Array.isArray(parsed)) {
          photos = parsed.filter(Boolean);
        } else if (parsed) {
          photos = [parsed];
        }

      } catch {

        // Si la chaîne contient directement une URL
        if (car.photos.startsWith("http")) {
          photos = [car.photos];
        }
      }
    }

    const firstPhoto = photos[0] || "";

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
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <div
                  style="
                    display:none;
                    width:100%;
                    height:100%;
                    align-items:center;
                    justify-content:center;
                    background:#111;
                    color:#aaa;
                  "
                >
                  Impossible de charger la photo
                </div>

                ${
                  photos.length > 1

                    ? `
                      <div
                        style="
                          position:absolute;
                          bottom:10px;
                          right:10px;
                          background:rgba(0,0,0,.75);
                          color:white;
                          padding:6px 10px;
                          border-radius:20px;
                          font-size:13px;
                        "
                      >
                        📷 ${photos.length} photos
                      </div>
                    `

                    : ""
                }
              `

              : `
                <div
                  style="
                    width:100%;
                    height:100%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:#111;
                    color:#aaa;
                  "
                >
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

            <span>
              ${esc(car.year)}
            </span>

            <span>
              ${esc(car.km)}
            </span>

            <span>
              ${esc(car.fuel)}
            </span>

            <span>
              ${esc(car.gear || "")}
            </span>

          </div>

          ${
            car.location

              ? `
                <div class="location">
                  📍 ${esc(car.location)}
                </div>
              `

              : ""
          }

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
     CLIC SUR UNE VOITURE
  ========================= */

  document.querySelectorAll(".car").forEach(card => {

    card.addEventListener("click", event => {

      if (
        event.target.closest("a") ||
        event.target.closest("button")
      ) {
        return;
      }

      const id = card.dataset.carId;

      if (!id) return;

      window.location.href =
        `voiture.html?id=${encodeURIComponent(id)}`;

    });

  });


  /* =========================
     MESSAGE AUCUNE ANNONCE
  ========================= */

  const empty = document.querySelector("#empty");

  if (empty) {
    empty.hidden = list.length > 0;
  }

}


/* =========================
   SÉCURISER L'AFFICHAGE
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
   ANNÉE DU FOOTER
========================= */

const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}


/* =========================
   LANCER LE SITE
========================= */

render();
