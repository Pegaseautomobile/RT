const CODE = "Pégase123";

const SUPABASE_URL = "https://lkuptpgposnungotdsbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_AWd0zD__eW-fZ4R-gzyhTw_82mwVbSk";

const API = `${SUPABASE_URL}/rest/v1/cars`;

const BUCKET = "car-photos";
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object`;

let cars = [];
let selectedPhotos = [];

const $ = id => document.getElementById(id);


/* =========================
   CONNEXION
========================= */

$("loginBtn").onclick = () => {

  const code = $("code").value.trim();

  if (code === CODE) {

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

        Authorization:
          `Bearer ${SUPABASE_KEY}`

      }

    });


    if (!response.ok) {

      throw new Error(
        await response.text()
      );

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
   COMPRESSER UNE IMAGE
========================= */

function compressImage(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();


    reader.onload = event => {

      const image = new Image();


      image.onload = () => {

        const maxWidth = 1600;
        const maxHeight = 1200;

        let width = image.width;
        let height = image.height;


        if (
          width > maxWidth ||
          height > maxHeight
        ) {

          const ratio = Math.min(
            maxWidth / width,
            maxHeight / height
          );

          width =
            Math.round(width * ratio);

          height =
            Math.round(height * ratio);

        }


        const canvas =
          document.createElement("canvas");


        canvas.width = width;
        canvas.height = height;


        const context =
          canvas.getContext("2d");


        context.drawImage(
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
                new Error(
                  "Impossible de compresser l'image."
                )
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

        reject(
          new Error(
            "Impossible de lire cette image."
          )
        );

      };


      image.src = event.target.result;

    };


    reader.onerror = () => {

      reject(
        new Error(
          "Impossible de lire le fichier."
        )
      );

    };


    reader.readAsDataURL(file);

  });

}


/* =========================
   ENVOYER UNE PHOTO
========================= */

async function uploadPhoto(file) {

  const blob =
    await compressImage(file);


  const filename =
    `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}.jpg`;


  const uploadUrl =
    `${STORAGE_URL}/${BUCKET}/${filename}`;


  const response =
    await fetch(uploadUrl, {

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

    const error =
      await response.text();

    throw new Error(
      "Erreur upload photo : " + error
    );

  }


  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;

}


/* =========================
   CHOISIR LES PHOTOS
========================= */

$("photos").onchange = async e => {

  const files =
    Array.from(e.target.files);


  if (!files.length) {
    return;
  }


  try {

    for (const file of files) {

      if (!file.type.startsWith("image/")) {

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
      "Impossible de charger les photos."
    );

  }


  e.target.value = "";

};


/* =========================
   APERÇU
========================= */

function preview() {

  const box =
    $("preview");


  if (!selectedPhotos.length) {

    box.innerHTML =
      "<p>Aucune photo sélectionnée.</p>";

    return;

  }


  box.innerHTML =
    selectedPhotos
      .map((photo, index) => {

        const source =
          photo.type === "new"
            ? photo.preview
            : photo.url;


        return `

          <div
            style="
              display:inline-flex;
              flex-direction:column;
              margin:6px;
              gap:5px;
            "
          >

            <img
              src="${source}"
              style="
                width:140px;
                height:100px;
                object-fit:cover;
                border-radius:10px;
              "
            >

            <button
              type="button"
              onclick="removePhoto(${index})"
              style="
                background:#e64b4b;
                color:white;
                border:0;
                border-radius:6px;
                padding:6px;
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


  selectedPhotos.splice(
    index,
    1
  );


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
      car =>
        String(car.id) ===
        String(editId)
    );


  try {

    const photoUrls = [];


    /*
      Envoyer les nouvelles photos
      dans Supabase Storage.
    */

    for (
      const photo of selectedPhotos
    ) {

      if (photo.type === "existing") {

        photoUrls.push(
          photo.url
        );

      }


      if (photo.type === "new") {

        const url =
          await uploadPhoto(
            photo.file
          );

        photoUrls.push(url);

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
        photoUrls

    };


    let response;


    /* MODIFICATION */

    if (editId) {

      response =
        await fetch(
          `${API}?id=eq.${editId}`,
          {

            method: "PATCH",

            headers: {

              apikey:
                SUPABASE_KEY,

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


    /* NOUVELLE ANNONCE */

    else {

      response =
        await fetch(
          API,
          {

            method: "POST",

            headers: {

              apikey:
                SUPABASE_KEY,

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

      throw new Error(
        await response.text()
      );

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
      "Erreur :\n\n" +
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
      .map(car => `

        <div class="admin-car">

          <div
            style="
              display:flex;
              gap:12px;
              align-items:center;
            "
          >

            ${
              car.photos &&
              car.photos.length

                ? `

                  <img
                    src="${esc(car.photos[0])}"
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
                ${esc(car.brand)}
                ${esc(car.model)}
              </b>

              <br>

              <span>
                ${esc(car.price)}
              </span>

            </div>

          </div>


          <div class="admin-actions">

            <button
              onclick="editCar('${esc(String(car.id))}')"
            >
              ✏️ Modifier
            </button>


            <button
              onclick="deleteCar('${esc(String(car.id))}')"
              style="
                background:#e64b4b;
                color:white;
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
   MODIFIER
========================= */

function editCar(id) {

  const car =
    cars.find(
      item =>
        String(item.id) ===
        String(id)
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

      throw new Error(
        await response.text()
      );

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

  $("carForm").reset();

  $("editId").value = "";

  selectedPhotos = [];

  $("preview").innerHTML =
    "<p>Aucune photo sélectionnée.</p>";

  $("formTitle").textContent =
    "Ajouter un véhicule";

}


/* =========================
   BOUTON ANNULER
========================= */

$("cancel").onclick =
  reset;


/* =========================
   PROTECTION TEXTE
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
