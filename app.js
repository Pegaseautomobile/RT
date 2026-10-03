const SUPABASE_URL = "https://lkuptpgposnungotdsbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_AWd0zD__eW-fZ4R-gzyhTw_82mwVbSk";

const API = `${SUPABASE_URL}/rest/v1/cars`;

let allCars = [];
let currentGalleryPhotos = [];
let currentPhotoIndex = 0;


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
      throw new Error("Erreur Supabase");
    }

    return await response.json();

  } catch (error) {

    console.error(error);

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

  const list = allCars.filter(c =>

    `${c.brand} ${c.model}`
      .toLowerCase()
      .includes(q)

    &&

    (!f || c.fuel === f)

  );

  const box = document.querySelector("#cars");

  if (!box) return;


  box.innerHTML = list.map((c, index) => {

    const photos =
      Array.isArray(c.photos)
        ? c.photos
        : [];


    const firstPhoto =
      photos.length
        ? photos[0]
        : "";


    return `

      <article class="car">

        <div
          class="car-img"
          data-car-index="${allCars.indexOf(c)}"
          style="
            cursor:pointer;
            position:relative;
            overflow:hidden;
          "
        >

          ${
            firstPhoto

              ? `

                <img
                  src="${firstPhoto}"
                  alt="${esc(c.brand)} ${esc(c.model)}"
                  style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    display:block;
                  "
                  onerror="this.style.display='none'"
                >

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
            ${esc(c.brand)} ${esc(c.model)}
          </h3>


          <div class="price">
            ${esc(c.price)}
          </div>


          <div class="meta">

            <span>${esc(c.year)}</span>

            <span>${esc(c.km)}</span>

            <span>${esc(c.fuel)}</span>

            <span>${esc(c.gear || "")}</span>

          </div>


          <p>
            ${esc(c.description || "")}
          </p>


          <a
            class="btn green call"
            href="tel:+33643486124"
          >
            📞 Mettre en relation avec le vendeur
          </a>

        </div>

      </article>

    `;

  }).join("");


  /* CLIC SUR LES PHOTOS */

  document
    .querySelectorAll(".car-img")
    .forEach(element => {

      element.addEventListener("click", () => {

        const index =
          Number(element.dataset.carIndex);

        const car = allCars[index];

        if (!car) return;

        openGallery(car);

      });

    });


  const empty =
    document.querySelector("#empty");

  if (empty) {

    empty.hidden =
      list.length > 0;

  }

}


/* =========================
   GALERIE
========================= */

function openGallery(car) {

  currentGalleryPhotos =
    Array.isArray(car.photos)
      ? car.photos.filter(Boolean)
      : [];


  if (!currentGalleryPhotos.length) {
    return;
  }


  currentPhotoIndex = 0;


  let modal =
    document.querySelector("#pegase-gallery");


  if (!modal) {

    modal =
      document.createElement("div");

    modal.id =
      "pegase-gallery";

    modal.innerHTML = `

      <div
        id="pegase-gallery-background"
        style="
          position:absolute;
          inset:0;
          background:rgba(0,0,0,.94);
        "
      ></div>


      <button
        id="pegase-gallery-close"
        style="
          position:absolute;
          top:18px;
          right:18px;
          z-index:10;
          width:45px;
          height:45px;
          border:none;
          border-radius:50%;
          background:rgba(255,255,255,.15);
          color:white;
          font-size:25px;
          cursor:pointer;
        "
      >
        ✕
      </button>


      <button
        id="pegase-gallery-prev"
        style="
          position:absolute;
          left:15px;
          top:50%;
          transform:translateY(-50%);
          z-index:10;
          width:50px;
          height:50px;
          border:none;
          border-radius:50%;
          background:rgba(255,255,255,.15);
          color:white;
          font-size:30px;
          cursor:pointer;
        "
      >
        ‹
      </button>


      <img
        id="pegase-gallery-image"
        style="
          position:absolute;
          top:50%;
          left:50%;
          transform:translate(-50%,-50%);
          max-width:88%;
          max-height:70%;
          object-fit:contain;
          border-radius:12px;
        "
      >


      <button
        id="pegase-gallery-next"
        style="
          position:absolute;
          right:15px;
          top:50%;
          transform:translateY(-50%);
          z-index:10;
          width:50px;
          height:50px;
          border:none;
          border-radius:50%;
          background:rgba(255,255,255,.15);
          color:white;
          font-size:30px;
          cursor:pointer;
        "
      >
        ›
      </button>


      <div
        id="pegase-gallery-counter"
        style="
          position:absolute;
          top:20px;
          left:50%;
          transform:translateX(-50%);
          color:white;
          font-size:16px;
          background:rgba(0,0,0,.6);
          padding:7px 14px;
          border-radius:20px;
        "
      ></div>


      <a
        href="tel:+33643486124"
        style="
          position:absolute;
          bottom:25px;
          left:50%;
          transform:translateX(-50%);
          z-index:10;
          background:#16a34a;
          color:white;
          text-decoration:none;
          padding:14px 22px;
          border-radius:30px;
          font-weight:bold;
          font-size:16px;
          white-space:nowrap;
        "
      >
        📞 Mettre en relation avec le vendeur
      </a>

    `;


    modal.style.position =
      "fixed";

    modal.style.inset =
      "0";

    modal.style.zIndex =
      "99999";

    modal.style.display =
      "none";


    document.body.appendChild(modal);


    document
      .querySelector("#pegase-gallery-close")
      .onclick = closeGallery;


    document
      .querySelector("#pegase-gallery-background")
      .onclick = closeGallery;


    document
      .querySelector("#pegase-gallery-prev")
      .onclick = previousPhoto;


    document
      .querySelector("#pegase-gallery-next")
      .onclick = nextPhoto;


    document.addEventListener(
      "keydown",
      galleryKeyboard
    );

  }


  modal.style.display =
    "block";


  updateGallery();

}


/* =========================
   ACTUALISER LA PHOTO
========================= */

function updateGallery() {

  const image =
    document.querySelector(
      "#pegase-gallery-image"
    );

  const counter =
    document.querySelector(
      "#pegase-gallery-counter"
    );


  if (!image || !counter) {
    return;
  }


  image.src =
    currentGalleryPhotos[
      currentPhotoIndex
    ];


  counter.textContent =
    `${currentPhotoIndex + 1} / ${currentGalleryPhotos.length}`;


  if (currentGalleryPhotos.length <= 1) {

    document.querySelector(
      "#pegase-gallery-prev"
    ).style.display = "none";


    document.querySelector(
      "#pegase-gallery-next"
    ).style.display = "none";

  } else {

    document.querySelector(
      "#pegase-gallery-prev"
    ).style.display = "block";


    document.querySelector(
      "#pegase-gallery-next"
    ).style.display = "block";

  }

}


/* =========================
   PHOTO PRÉCÉDENTE
========================= */

function previousPhoto() {

  if (!currentGalleryPhotos.length) {
    return;
  }


  currentPhotoIndex--;

  if (currentPhotoIndex < 0) {

    currentPhotoIndex =
      currentGalleryPhotos.length - 1;

  }


  updateGallery();

}


/* =========================
   PHOTO SUIVANTE
========================= */

function nextPhoto() {

  if (!currentGalleryPhotos.length) {
    return;
  }


  currentPhotoIndex++;

  if (
    currentPhotoIndex >=
    currentGalleryPhotos.length
  ) {

    currentPhotoIndex = 0;

  }


  updateGallery();

}


/* =========================
   FERMER LA GALERIE
========================= */

function closeGallery() {

  const modal =
    document.querySelector(
      "#pegase-gallery"
    );


  if (modal) {

    modal.style.display =
      "none";

  }

}


/* =========================
   CLAVIER
========================= */

function galleryKeyboard(e) {

  const modal =
    document.querySelector(
      "#pegase-gallery"
    );


  if (
    !modal ||
    modal.style.display === "none"
  ) {

    return;

  }


  if (e.key === "Escape") {
    closeGallery();
  }


  if (e.key === "ArrowLeft") {
    previousPhoto();
  }


  if (e.key === "ArrowRight") {
    nextPhoto();
  }

}


/* =========================
   PROTECTION DU TEXTE
========================= */

function esc(v) {

  return String(v ?? "").replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[m]
  );

}


/* =========================
   RECHERCHE
========================= */

document
  .querySelector("#search")
  ?.addEventListener(
    "input",
    render
  );


/* =========================
   FILTRE CARBURANT
========================= */

document
  .querySelector("#fuel")
  ?.addEventListener(
    "change",
    render
  );


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
