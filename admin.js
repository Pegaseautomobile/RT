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
      throw new Error("Erreur Supabase");
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

$("photos").onchange = async e => {

  selectedPhotos = await Promise.all(

    [...e.target.files].map(file =>

      new Promise(resolve => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.readAsDataURL(file);

      })

    )

  );

  preview();

};


function preview() {

  $("preview").innerHTML = selectedPhotos

    .map(photo => `<img src="${photo}">`)

    .join("");

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

    brand: $("brand").value,

    model: $("model").value,

    price: $("price").value,

    year: Number($("year").value),

    km: $("km").value,

    fuel: $("carFuel").value,

    gear: $("gear").value,

    location: $("location").value,

    description: $("description").value,

    photos:
      selectedPhotos.length
        ? selectedPhotos
        : old?.photos || []

  };


  try {

    let response;


    /* MODIFIER */

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


    /* AJOUTER */

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

        <div style="display:flex;gap:12px;align-items:center">

          ${
            c.photos?.[0]
              ? `<img src="${c.photos[0]}">`
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
            style="background:#e64b4b;color:#fff"
          >
            🗑️ Supprimer
          </button>

        </div>

      </div>

    `)

    .join("");

}


/* =========================
   MODIFIER
========================= */

function editCar(id) {

  const car = cars.find(
    c => String(c.id) === String(id)
  );

  if (!car) return;


  $("editId").value = car.id;

  $("brand").value = car.brand;

  $("model").value = car.model;

  $("price").value = car.price;

  $("year").value = car.year;

  $("km").value = car.km;

  $("carFuel").value = car.fuel;

  $("gear").value = car.gear;

  $("location").value = car.location;

  $("description").value = car.description;


  selectedPhotos = car.photos || [];

  preview();


  $("formTitle").textContent =
    "Modifier le véhicule";


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================
   SUPPRIMER
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
      throw new Error("Suppression impossible.");
    }


    await loadCars();


  } catch (error) {

    console.error(error);

    alert(
      "Erreur lors de la suppression."
    );

  }

}


/* =========================
   ANNULER
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
   PROTECTION AFFICHAGE
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
