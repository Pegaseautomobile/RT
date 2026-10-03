const CODE = "Pégase123";

const SUPABASE_URL = "https://lkuptpgposnungotdsbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_AWd0zD__eW-fZ4R-gzyhTw_82mwVbSk";

const API = `${SUPABASE_URL}/rest/v1/cars`;
const BUCKET = "car-photos";

let cars = [];
let selectedPhotos = [];

const $ = id => document.getElementById(id);

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
   CONNEXION
========================= */

$("loginBtn").onclick = () => {
  if ($("code").value.trim() === CODE) {
    sessionStorage.setItem("pegaseAdmin", "1");
    show();
  } else {
    $("error").textContent = "Code incorrect.";
  }
};

$("code").addEventListener("keydown", e => {
  if (e.key === "Enter") $("loginBtn").click();
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
   SÉLECTION DES PHOTOS
========================= */

$("photos").addEventListener("change", e => {

  const files = Array.from(e.target.files);

  selectedPhotos = files.map(file => ({
    type: "new",
    file: file,
    preview: URL.createObjectURL(file)
  }));

  preview();
});

/* =========================
   APERÇU
========================= */

function preview() {

  if (!selectedPhotos.length) {
    $("preview").innerHTML = `
      <p style="opacity:.6">
        Aucune photo sélectionnée
      </p>
    `;
    return;
  }

  $("preview").innerHTML = selectedPhotos.map((photo, index) => {

    const src =
      photo.type === "new"
        ? photo.preview
        : photo.url;

    return `
      <div style="
        position:relative;
        display:inline-block;
        margin:6px;
      ">

        <img
          src="${src}"
          style="
            width:150px;
            height:100px;
            object-fit:cover;
            border-radius:10px;
          "
        >

        <button
          type="button"
          onclick="removePhoto(${index})"
          style="
            position:absolute;
            top:5px;
            right:5px;
            width:28px;
            height:28px;
            border:0;
            border-radius:50%;
            background:#e33;
            color:white;
            font-size:20px;
            cursor:pointer;
          "
        >
          ×
        </button>

      </div>
    `;

  }).join("");
}

function removePhoto(index) {

  const photo = selectedPhotos[index];

  if (photo?.preview) {
    URL.revokeObjectURL(photo.preview);
  }

  selectedPhotos.splice(index, 1);

  preview();
}

/* =========================
   UPLOAD SUPABASE
========================= */

async function uploadPhoto(file) {

  const extension =
    file.name.includes(".")
      ? file.name.split(".").pop().toLowerCase()
      : "jpg";

  const filename =
    `car-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}.${extension}`;

  const url =
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`;

  console.log("Upload de :", file.name);
  console.log("Destination :", url);

  const response = await fetch(url, {
    method: "POST",

    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": file.type || "image/jpeg"
    },

    body: file
  });

  const text = await response.text();

  console.log(
    "Réponse Supabase :",
    response.status,
    text
  );

  if (!response.ok) {
    throw new Error(
      `Upload photo impossible (${response.status}) : ${text}`
    );
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

/* =========================
   ENREGISTRER
========================= */

$("carForm").onsubmit = async e => {

  e.preventDefault();

  const button =
    $("carForm").querySelector(
      'button[type="submit"]'
    );

  const originalText = button.innerHTML;

  const editId = $("editId").value;

  try {

    button.disabled = true;
    button.innerHTML = "⏳ Envoi des photos...";

    const photoUrls = [];

    for (let i = 0; i < selectedPhotos.length; i++) {

      const photo = selectedPhotos[i];

      if (photo.type === "existing") {

        photoUrls.push(photo.url);

      } else {

        button.innerHTML =
          `⏳ Envoi de la photo ${i + 1}/${selectedPhotos.length}...`;

        const url = await uploadPhoto(photo.file);

        photoUrls.push(url);
      }
    }

    console.log("Photos finales :", photoUrls);

    const car = {
      brand: $("brand").value.trim(),
      model: $("model").value.trim(),
      price: $("price").value.trim(),
      year: Number($("year").value),
      km: $("km").value.trim(),
      fuel: $("carFuel").value,
      gear: $("gear").value,
      location: $("location").value.trim(),
      description: $("description").value.trim(),
      photos: photoUrls
    };

    console.log("Annonce envoyée :", car);

    button.innerHTML = "⏳ Enregistrement...";

    let response;

    if (editId) {

      response = await fetch(
        `${API}?id=eq.${encodeURIComponent(editId)}`,
        {
          method: "PATCH",

          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },

          body: JSON.stringify(car)
        }
      );

    } else {

      response = await fetch(API, {
        method: "POST",

        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },

        body: JSON.stringify(car)
      });

    }

    const result = await response.text();

    console.log(
      "Réponse base de données :",
      response.status,
      result
    );

    if (!response.ok) {
      throw new Error(result);
    }

    alert(
      editId
        ? "✅ Annonce modifiée avec succès !"
        : "✅ Annonce publiée avec succès !"
    );

    reset();

    await loadCars();

  } catch (error) {

    console.error("ERREUR :", error);

    alert(
      "❌ L'annonce n'a pas été enregistrée.\n\n" +
      error.message
    );

  } finally {

    button.disabled = false;
    button.innerHTML = originalText;

  }
};

/* =========================
   LISTE ADMIN
========================= */

function renderAdmin() {

  $("count").textContent = cars.length;

  $("adminCars").innerHTML = cars.map(car => `

    <div class="admin-car">

      <div style="
        display:flex;
        gap:12px;
        align-items:center;
      ">

        ${
          car.photos?.[0]
            ? `
              <img
                src="${esc(car.photos[0])}"
                style="
                  width:100px;
                  height:70px;
                  object-fit:cover;
                  border-radius:8px;
                "
              >
            `
            : ""
        }

        <div>
          <b>
            ${esc(car.brand)}
            ${esc(car.model)}
          </b>

          <br>

          <span>
            ${esc(car.price)}
          </span>

          <br>

          <small>
            ${car.photos?.length || 0} photo(s)
          </small>
        </div>

      </div>

      <div class="admin-actions">

        <button onclick="editCar('${car.id}')">
          ✏️ Modifier
        </button>

        <button
          onclick="deleteCar('${car.id}')"
          style="
            background:#e64b4b;
            color:white;
          "
        >
          🗑️ Supprimer
        </button>

      </div>

    </div>

  `).join("");
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
  $("brand").value = car.brand || "";
  $("model").value = car.model || "";
  $("price").value = car.price || "";
  $("year").value = car.year || "";
  $("km").value = car.km || "";
  $("carFuel").value = car.fuel || "";
  $("gear").value = car.gear || "";
  $("location").value = car.location || "";
  $("description").value = car.description || "";

  selectedPhotos = (car.photos || []).map(url => ({
    type: "existing",
    url: url
  }));

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

  if (!confirm("Supprimer définitivement cette annonce ?")) {
    return;
  }

  try {

    const response = await fetch(
      `${API}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",

        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    await loadCars();

  } catch (error) {

    console.error(error);

    alert(
      "Erreur lors de la suppression.\n\n" +
      error.message
    );
  }
}

/* =========================
   RESET
========================= */

function reset() {

  selectedPhotos.forEach(photo => {
    if (photo.preview) {
      URL.revokeObjectURL(photo.preview);
    }
  });

  selectedPhotos = [];

  $("carForm").reset();
  $("editId").value = "";

  $("formTitle").textContent =
    "Ajouter un véhicule";

  preview();
}

$("cancel").onclick = reset;

preview();
