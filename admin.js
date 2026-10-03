const CODE = "Pégase123";

const SUPABASE_URL = "https://lkuptpgposnungotdsbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_AWd0zD__eW-fZ4R-gzyhTw_82mwVbSk";

const API = `${SUPABASE_URL}/rest/v1/cars`;

let cars = [];
let selectedPhotos = [];

const $ = id => document.getElementById(id);


/* =========================
   CONNEXION ADMIN
========================= */

$("loginBtn").onclick = () => {

  const enteredCode = $("code").value.trim();

  if (enteredCode === CODE) {

    sessionStorage.setItem("pegaseAdmin", "1");

    show();

  } else {

    $("error").textContent = "Code incorrect.";

  }

};


$("code").addEventListener("keydown", e => {

  if (e.key === "Enter") {
    $("loginBtn").click();
  }

});


$("logout").onclick = () => {

  sessionStorage.removeItem("pegaseAdmin");

  location.reload();

};


function show() {

  $("login").hidden = true;
  $("panel").hidden = false;

  loadCars();

}


if (sessionStorage.getItem("pegaseAdmin") === "1") {
  show();
}


/* =========================
   CHARGER LES ANNONCES
========================= */

async function loadCars() {

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

    cars = await response.json();

    renderAdmin();

  } catch (error) {

    console.error(error);

    $("adminCars").innerHTML =
      "<p>Impossible de charger les annonces.</p>";

  }

}


/* =========================
   PHOTOS
========================= */

/*
   On compresse les photos avant de les enregistrer.
   Cela évite d'envoyer des images énormes à Supabase.
*/

function compressImage(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = event => {

      const image = new Image();

      image.onload = () => {

        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1000;

        let width = image.width;
        let height = image.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {

          const ratio = Math.min(
            MAX_WIDTH / width,
            MAX_HEIGHT / height
          );

          width = Math.round(width * ratio);
          height = Math.round(height * ratio);

        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        const compressed = canvas.toDataURL(
          "image/jpeg",
          0.72
        );

        resolve(compressed);

      };

      image.onerror = () => {
        reject(new Error("Impossible de lire l'image."));
      };

      image.src = event.target.result;

    };

    reader.onerror = () => {
      reject(new Error("Impossible de charger la photo."));
    };

    reader.readAsDataURL(file);

  });

}


/* =========================
   SÉLECTION DES PHOTOS
========================= */

$("photos").onchange = async e => {

  const files = [...e.target.files];

  if (!files.length) {
    return;
  }

  try {

    $("preview").innerHTML =
      "<p>Compression des photos...</p>";

    const newPhotos = await Promise.all(

      files.map(file => compressImage(file))

    );

    selectedPhotos = [
      ...selectedPhotos,
      ...newPhotos
    ];

    preview();

  } catch (error) {

    console.error(error);

    alert(
      "Une ou plusieurs photos n'ont pas pu être chargées."
    );

    preview();

  }

};


/* =========================
   APERÇU DES PHOTOS
========================= */

function preview() {

  if (!selectedPhotos.length) {

    $("preview").innerHTML =
      "<p>Aucune photo sélectionnée.</p>";

    return;

  }

  $("preview").innerHTML = selectedPhotos

    .map((photo, index) => `

      <div
        style="
          display:inline-flex;
          flex-direction:column;
          gap:6px;
          margin:6px;
          vertical-align:top;
        "
      >

        <img
          src="${photo}"
          style="
            width:140px;
            height:100px;
            object-fit:cover;
            border-radius:10px;
            border:2px solid #ddd;
          "
        >

        <button
          type="button"
          onclick="removePhoto(${index})"
          style="
            background:#e64b4b;
            color:white;
            border:none;
            padding:6px;
            border-radius:6px;
            cursor:pointer;
          "
        >
          🗑️ Supprimer
        </button>

      </div>

    `)

    .join("");

}


/* =========================
   SUPPRIMER UNE PHOTO
========================= */

function removePhoto(index) {

  selectedPhotos.splice(index, 1);

  preview();

}


/* =========================
   AJOUTER / MODIFIER
========================= */

$("carForm").onsubmit = async e => {

  e.preventDefault();

  const editId = $("editId").value;

  const old = cars.find(
    c => String(c.id) === String(editId)
  );


  const car = {

    brand: $("brand").value.trim(),

    model: $("model").value.trim(),

    price: $("price").value.trim(),

    year: Number($("year").value),

    km: $("km").value.trim(),

    fuel: $("carFuel").value,

    gear: $("gear").value.trim(),

    location: $("location").value.trim(),

    description: $("description").value.trim(),

    photos:
      selectedPhotos.length
        ? selectedPhotos
        : old?.photos || []

  };


  try {

    let response;


    /* =========================
       MODIFIER
    ========================= */

    if (editId) {

      response = await fetch(

        `${API}?id=eq.${editId}`,

        {

          method: "PATCH",

          headers: {

            apikey: SUPABASE_KEY,

            Authorization: `Bearer ${SUPABASE_KEY}`,

            "Content-Type": "application/json",

            Prefer: "return=minimal"

          },

          body: JSON.stringify(car)

        }

      );

    }


    /* =========================
       AJOUTER
    ========================= */

    else {

      response = await fetch(

        API,

        {

          method: "POST",

          headers: {

            apikey: SUPABASE_KEY,

            Authorization: `Bearer ${SUPABASE_KEY}`,

            "Content-Type": "application/json",

            Prefer: "return=minimal"

          },

          body: JSON.stringify(car)

        }

      );

    }


    if (!response.ok) {

      const errorText = await response.text();

      console.error(errorText);

      throw new Error(errorText);

    }


    alert(

      editId
        ? "Annonce modifiée avec succès !"
        : "Annonce ajoutée avec succès !"

    );


    reset();

    await loadCars();


  } catch (error) {

    console.error(error);

    alert(
      "Erreur lors de l'enregistrement de l'annonce."
    );

  }

};


/* =========================
   AFFICHER LES ANNONCES
========================= */

function renderAdmin() {

  $("count").textContent = cars.length;


  $("adminCars").innerHTML = cars

    .map(c => `

      <div class="admin-car">

        <div
          style="
            display:flex;
            gap:12px;
            align-items:center;
          "
        >

          ${
            c.photos?.[0]

              ? `

                <img
                  src="${c.photos[0]}"
                  style="
                    width:100px;
                    height:75px;
                    object-fit:cover;
                    border-radius:10px;
                  "
                >

              `

              : ""

          }


          <div>

            <b>
              ${esc(c.brand)} ${esc(c.model)}
            </b>

            <br>

            <span>
              ${esc(c.price)}
            </span>

          </div>

        </div>


        <div class="admin-actions">

          <button
            onclick="editCar('${c.id}')"
          >
            ✏️ Modifier
          </button>


          <button
            onclick="deleteCar('${c.id}')"
            style="
              background:#e64b4b;
              color:#fff;
            "
          >
            🗑️ Supprimer
          </button>

        </div>

      </div>

    `)

    .join("");

}


/* =========================
   MODIFIER UNE ANNONCE
========================= */

function editCar(id) {

  const car = cars.find(
    c => String(c.id) === String(id)
  );

  if (!car) return;


  $("editId").value = car.id;

  $("brand").value = car.brand || "";

  $("model").value = car.model || "";

  $("price").value = car.price || "";

  $("year").value = car.year || "";

  $("km").value = car.km || "";

  $("carFuel").value = car.fuel || "";

  $("gear").value = car.gear || "";

  $("location").value = car.location || "";

  $("description").value =
    car.description || "";


  selectedPhotos = Array.isArray(car.photos)
    ? [...car.photos]
    : [];


  preview();


  $("formTitle").textContent =
    "Modifier le véhicule";


  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });

}


/* =========================
   SUPPRIMER UNE ANNONCE
========================= */

async function deleteCar(id) {

  if (
    !confirm(
      "Supprimer définitivement cette annonce ?"
    )
  ) {
    return;
  }


  try {

    const response = await fetch(

      `${API}?id=eq.${id}`,

      {

        method: "DELETE",

        headers: {

          apikey: SUPABASE_KEY,

          Authorization: `Bearer ${SUPABASE_KEY}`

        }

      }

    );


    if (!response.ok) {

      const errorText = await response.text();

      throw new Error(errorText);

    }


    alert("Annonce supprimée avec succès !");

    await loadCars();


  } catch (error) {

    console.error(error);

    alert(
      "Erreur lors de la suppression."
    );

  }

}


/* =========================
   ANNULER / RÉINITIALISER
========================= */

function reset() {

  $("carForm").reset();

  $("editId").value = "";

  selectedPhotos = [];

  preview();

  $("formTitle").textContent =
    "Ajouter un véhicule";

}


$("cancel").onclick = reset;


/* =========================
   PROTECTION DU TEXTE
========================= */

function esc(value) {

  return String(value ?? "").replace(

    /[&<>"']/g,

    character => ({

      "&": "&amp;",

      "<": "&lt;",

      ">": "&gt;",

      '"': "&quot;",

      "'": "&#039;"

    }[character])

  );

}
