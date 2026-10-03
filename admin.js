const CODE = "Pégase123";

const SUPABASE_URL = "https://lkuptpgposnungotdsbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_AWd0zD__eW-fZ4R-gzyhTw_82mwVbSk";

const API = `${SUPABASE_URL}/rest/v1/cars`;
const STORAGE_BUCKET = "car-photos";
const STORAGE_API = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}`;
const PUBLIC_STORAGE = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}`;

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
   COMPRESSER UNE PHOTO
========================= */

function compressImage(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = event => {

      const image = new Image();

      image.onload = () => {

        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1200;

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

        canvas.toBlob(
          blob => {

            if (!blob) {
              reject(
                new Error("Compression de la photo impossible.")
              );
              return;
            }

            resolve(blob);

          },
          "image/jpeg",
          0.82
        );

      };

      image.onerror = () => {
        reject(new Error("Image impossible à lire."));
      };

      image.src = event.target.result;

    };

    reader.onerror = () => {
      reject(new Error("Impossible de lire le fichier."));
    };

    reader.readAsDataURL(file);

  });

}


/* =========================
   ENVOYER UNE PHOTO
   VERS SUPABASE STORAGE
========================= */

async function uploadPhoto(file) {

  const blob = await compressImage(file);

  const uniqueName =
    `${Date.now()}-${crypto.randomUUID()}.jpg`;

  const uploadUrl =
    `${STORAGE_API}/${uniqueName}`;


  const response = await fetch(uploadUrl, {

    method: "POST",

    headers: {

      apikey: SUPABASE_KEY,

      Authorization:
        `Bearer ${SUPABASE_KEY}`,

      "Content-Type":
        "image/jpeg",

      "x-upsert":
        "false"

    },

    body: blob

  });


  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      `Upload photo impossible : ${errorText}`
    );

  }


  return {
    url: `${PUBLIC_STORAGE}/${uniqueName}`,
    path: uniqueName
  };

}


/* =========================
   SUPPRIMER UNE PHOTO
   DE STORAGE
========================= */

async function deleteStoragePhoto(url) {

  if (!url) {
    return;
  }


  if (!url.startsWith(PUBLIC_STORAGE)) {
    return;
  }


  const path =
    decodeURIComponent(
      url.substring(
        `${PUBLIC_STORAGE}/`.length
      )
    );


  if (!path) {
    return;
  }


  try {

    await fetch(
      `${STORAGE_API}/${path}`,
      {

        method: "DELETE",

        headers: {

          apikey: SUPABASE_KEY,

          Authorization:
            `Bearer ${SUPABASE_KEY}`

        }

      }
    );

  } catch (error) {

    console.error(
      "Suppression photo impossible :",
      error
    );

  }

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
      "<p>Préparation des photos...</p>";


    for (const file of files) {

      if (!file.type.startsWith("image/")) {

        alert(
          `${file.name} n'est pas une image.`
        );

        continue;

      }


      const previewUrl =
        URL.createObjectURL(file);


      selectedPhotos.push({
        type: "new",
        file: file,
        preview: previewUrl
      });

    }


    preview();


  } catch (error) {

    console.error(error);

    alert(
      "Impossible de préparer les photos."
    );

    preview();

  }


  /*
    Permet de sélectionner à nouveau
    les mêmes fichiers.
  */

  e.target.value = "";

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


  $("preview").innerHTML =

    selectedPhotos
      .map((photo, index) => {

        const src =
          photo.type === "new"
            ? photo.preview
            : photo.url;


        return `

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
              src="${src}"
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

        `;

      })
      .join("");

}


/* =========================
   SUPPRIMER UNE PHOTO
========================= */

function removePhoto(index) {

  const photo =
    selectedPhotos[index];


  if (
    photo &&
    photo.type === "new" &&
    photo.preview
  ) {

    URL.revokeObjectURL(
      photo.preview
    );

  }


  selectedPhotos.splice(index, 1);

  preview();

}


/* =========================
   AJOUTER / MODIFIER
========================= */

$("carForm").onsubmit = async e => {

  e.preventDefault();


  const editId =
    $("editId").value;


  const old =
    cars.find(
      c => String(c.id) === String(editId)
    );


  try {

    /*
      Les anciennes URLs sont conservées.
      Les nouvelles photos seront uploadées
      dans Supabase Storage.
    */

    const finalPhotos = [];

    const newlyUploaded = [];


    /*
      UPLOAD DES PHOTOS
    */

    for (const photo of selectedPhotos) {

      if (photo.type === "existing") {

        finalPhotos.push(
          photo.url
        );

        continue;

      }


      if (photo.type === "new") {

        const uploaded =
          await uploadPhoto(
            photo.file
          );


        finalPhotos.push(
          uploaded.url
        );


        newlyUploaded.push(
          uploaded.url
        );

      }

    }


    const car = {

      brand:
        $("brand").value.trim(),

      model:
        $("model").value.trim(),

      price:
        $("price").value.trim(),

      year:
        Number($("year").value),

      km:
        $("km").value.trim(),

      fuel:
        $("carFuel").value,

      gear:
        $("gear").value.trim(),

      location:
        $("location").value.trim(),

      description:
        $("description").value.trim(),

      photos:
        finalPhotos

    };


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

            Authorization:
              `Bearer ${SUPABASE_KEY}`,

            "Content-Type":
              "application/json",

            Prefer:
              "return=minimal"

          },

          body:
            JSON.stringify(car)

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

            Authorization:
              `Bearer ${SUPABASE_KEY}`,

            "Content-Type":
              "application/json",

            Prefer:
              "return=minimal"

          },

          body:
            JSON.stringify(car)

        }

      );

    }


    if (!response.ok) {

      const errorText =
        await response.text();


      /*
        Si l'annonce n'a pas été enregistrée,
        on supprime les nouvelles photos
        envoyées inutilement.
      */

      for (
        const photoUrl of newlyUploaded
      ) {

        await deleteStoragePhoto(
          photoUrl
        );

      }


      throw new Error(
        errorText
      );

    }


    /*
      Si on modifiait une annonce,
      les anciennes photos retirées
      peuvent être supprimées de Storage.
    */

    if (editId && old?.photos) {

      for (
        const oldPhoto of old.photos
      ) {

        if (
          !finalPhotos.includes(oldPhoto)
        ) {

          await deleteStoragePhoto(
            oldPhoto
          );

        }

      }

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
      "Erreur lors de l'enregistrement :\n\n" +
      error.message
    );

  }

};


/* =========================
   AFFICHER LES ANNONCES
========================= */

function renderAdmin() {

  $("count").textContent =
    cars.length;


  $("adminCars").innerHTML =

    cars
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
                    src="${esc(c.photos[0])}"
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
                ${esc(c.brand)}
                ${esc(c.model)}
              </b>

              <br>

              <span>
                ${esc(c.price)}
              </span>

            </div>

          </div>


          <div class="admin-actions">

            <button
              onclick="editCar('${esc(String(c.id))}')"
            >
              ✏️ Modifier
            </button>


            <button
              onclick="deleteCar('${esc(String(c.id))}')"
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

  const car =
    cars.find(
      c => String(c.id) === String(id)
    );


  if (!car) {
    return;
  }


  $("editId").value =
    car.id;


  $("brand").value =
    car.brand || "";


  $("model").value =
    car.model || "";


  $("price").value =
    car.price || "";


  $("year").value =
    car.year || "";


  $("km").value =
    car.km || "";


  $("carFuel").value =
    car.fuel || "";


  $("gear").value =
    car.gear || "";


  $("location").value =
    car.location || "";


  $("description").value =
    car.description || "";


  selectedPhotos =
    Array.isArray(car.photos)

      ? car.photos.map(url => ({
          type: "existing",
          url: url
        }))

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

    const car =
      cars.find(
        c => String(c.id) === String(id)
      );


    /*
      Supprimer l'annonce
      de la table cars.
    */

    const response =
      await fetch(

        `${API}?id=eq.${id}`,

        {

          method: "DELETE",

          headers: {

            apikey:
              SUPABASE_KEY,

            Authorization:
              `Bearer ${SUPABASE_KEY}`

          }

        }

      );


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        errorText
      );

    }


    /*
      Supprimer aussi ses photos
      de Supabase Storage.
    */

    if (car?.photos) {

      for (
        const photo of car.photos
      ) {

        await deleteStoragePhoto(
          photo
        );

      }

    }


    alert(
      "Annonce supprimée avec succès !"
    );


    await loadCars();


  } catch (error) {

    console.error(error);

    alert(
      "Erreur lors de la suppression :\n\n" +
      error.message
    );

  }

}


/* =========================
   ANNULER
========================= */

function reset() {

  /*
    Libérer les aperçus temporaires.
  */

  selectedPhotos.forEach(photo => {

    if (
      photo.type === "new" &&
      photo.preview
    ) {

      URL.revokeObjectURL(
        photo.preview
      );

    }

  });


  $("carForm").reset();

  $("editId").value = "";

  selectedPhotos = [];

  preview();


  $("formTitle").textContent =
    "Ajouter un véhicule";

}


$("cancel").onclick =
  reset;


/* =========================
   PROTECTION DU TEXTE
========================= */

function esc(value) {

  return String(
    value ?? ""
  ).replace(

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
