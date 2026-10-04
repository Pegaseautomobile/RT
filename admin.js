const CODE = "Pégase123";

const SUPABASE_URL = "https://lkuptpgposnungotdsbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_AWd0zD__eW-fZ4R-gzyhTw_82mwVbSk";

const API = `${SUPABASE_URL}/rest/v1/cars`;
const STORAGE_BUCKET = "car-photos";
const STORAGE_API = `${SUPABASE_URL}/storage/v1`;

let cars = [];
let selectedPhotos = [];
let existingPhotos = [];


/* =========================
   OUTILS
========================= */

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

function isValidPhotoUrl(value) {
  return (
    typeof value === "string" &&
    /^https?:\/\//i.test(value)
  );
}


/* =========================
   CONNEXION ADMIN
========================= */

$("loginBtn").onclick = () => {

  if ($("code").value.trim() === CODE) {

    sessionStorage.setItem("pegaseAdmin", "1");

    show();

  } else {

    $("error").textContent =
      "Code incorrect.";
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
   SÉLECTION DES PHOTOS
========================= */

$("photos").addEventListener("change", event => {

  const files = Array.from(event.target.files || []);

  files.forEach(file => {

    if (!file.type.startsWith("image/")) {
      return;
    }

    selectedPhotos.push({

      file: file,

      preview:
        URL.createObjectURL(file)

    });

  });

  preview();

});


/* =========================
   APERÇU DES PHOTOS
========================= */

function preview() {

  let html = "";


  /* PHOTOS DÉJÀ ENREGISTRÉES */

  existingPhotos.forEach((photo, index) => {

    html += `

      <div style="
        position:relative;
        display:inline-block;
        margin:6px;
      ">

        <img
          src="${esc(photo)}"
          style="
            width:150px;
            height:100px;
            object-fit:cover;
            border-radius:10px;
            display:block;
          "
        >

        <button
          type="button"
          onclick="removeExistingPhoto(${index})"
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

  });


  /* NOUVELLES PHOTOS */

  selectedPhotos.forEach((photo, index) => {

    html += `

      <div style="
        position:relative;
        display:inline-block;
        margin:6px;
      ">

        <img
          src="${esc(photo.preview)}"
          style="
            width:150px;
            height:100px;
            object-fit:cover;
            border-radius:10px;
            display:block;
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

  });


  $("preview").innerHTML =
    html ||
    "<p style='opacity:.6'>Aucune photo sélectionnée</p>";
}


/* =========================
   SUPPRIMER UNE PHOTO EXISTANTE
========================= */

function removeExistingPhoto(index) {

  existingPhotos.splice(index, 1);

  preview();
}


/* =========================
   SUPPRIMER UNE NOUVELLE PHOTO
========================= */

function removePhoto(index) {

  const photo =
    selectedPhotos[index];

  if (photo?.preview) {

    URL.revokeObjectURL(
      photo.preview
    );

  }

  selectedPhotos.splice(index, 1);

  preview();
}


/* =========================
   COMPRESSER UNE PHOTO
========================= */

function compressPhoto(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = event => {

      const image = new Image();

      image.onload = () => {

        const maxSize = 1600;

        let width = image.width;
        let height = image.height;


        if (
          width > maxSize ||
          height > maxSize
        ) {

          if (width > height) {

            height = Math.round(
              height * maxSize / width
            );

            width = maxSize;

          } else {

            width = Math.round(
              width * maxSize / height
            );

            height = maxSize;
          }

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
                  "Impossible de préparer la photo."
                )
              );

              return;
            }

            resolve(blob);

          },
          "image/jpeg",
          0.80
        );

      };


      image.onerror = () => {

        reject(
          new Error(
            "Impossible de lire une image."
          )
        );

      };


      image.src =
        event.target.result;
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
   VERS SUPABASE STORAGE
========================= */

async function uploadPhoto(file) {

  const compressed =
    await compressPhoto(file);


  const uniqueName =
    `${Date.now()}-${crypto.randomUUID()}.jpg`;


  const storagePath =
    `cars/${uniqueName}`;


  const response = await fetch(
    `${STORAGE_API}/object/${STORAGE_BUCKET}/${storagePath}`,
    {

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

      body: compressed

    }
  );


  if (!response.ok) {

    throw new Error(
      await response.text()
    );

  }


  return (
    `${SUPABASE_URL}/storage/v1/object/public/` +
    `${STORAGE_BUCKET}/${storagePath}`
  );
}


/* =========================
   EXTRAIRE LE CHEMIN STORAGE
========================= */

function getStoragePath(url) {

  if (!isValidPhotoUrl(url)) {
    return null;
  }


  const marker =
    `/storage/v1/object/public/${STORAGE_BUCKET}/`;


  const index =
    url.indexOf(marker);


  if (index === -1) {
    return null;
  }


  return decodeURIComponent(
    url.substring(
      index + marker.length
    )
  );
}


/* =========================
   SUPPRIMER DES PHOTOS STORAGE
========================= */

async function deleteStoragePhotos(urls) {

  const paths =
    urls
      .map(getStoragePath)
      .filter(Boolean);


  if (!paths.length) {
    return;
  }


  const response =
    await fetch(
      `${STORAGE_API}/object/${STORAGE_BUCKET}`,
      {

        method: "DELETE",

        headers: {

          apikey: SUPABASE_KEY,

          Authorization:
            `Bearer ${SUPABASE_KEY}`,

          "Content-Type":
            "application/json"

        },

        body: JSON.stringify({
          prefixes: paths
        })

      }
    );


  if (!response.ok) {

    console.error(
      "Erreur suppression Storage :",
      await response.text()
    );

  }
}


/* =========================
   ENREGISTRER UNE ANNONCE
========================= */

$("carForm").onsubmit = async event => {

  event.preventDefault();


  const button =
    $("carForm").querySelector(
      'button[type="submit"]'
    );


  const originalText =
    button.innerHTML;


  const editId =
    $("editId").value;


  const oldPhotos =
    editId
      ? (
          cars.find(
            car =>
              String(car.id) ===
              String(editId)
          )?.photos || []
        )
      : [];


  try {

    button.disabled = true;


    /* =====================
       UPLOAD DES NOUVELLES PHOTOS
    ===================== */

    const newPhotoUrls = [];


    for (
      let i = 0;
      i < selectedPhotos.length;
      i++
    ) {

      button.innerHTML =
        `⏳ Envoi photo ${i + 1}/${selectedPhotos.length}...`;


      const url =
        await uploadPhoto(
          selectedPhotos[i].file
        );


      newPhotoUrls.push(url);

    }


    /* =====================
       PHOTOS FINALES
    ===================== */

    const allPhotos = [
      ...existingPhotos.filter(
        isValidPhotoUrl
      ),
      ...newPhotoUrls
    ];


    const car = {

      brand:
        $("brand").value.trim(),

      model:
        $("model").value.trim(),

      price:
        $("price").value.trim(),

      year:
        Number(
          $("year").value
        ),

      km:
        $("km").value.trim(),

      fuel:
        $("carFuel").value,

      gear:
        $("gear").value,

      location:
        $("location").value.trim(),

      description:
        $("description").value.trim(),

      photos:
        allPhotos

    };


    button.innerHTML =
      "⏳ Enregistrement...";


    let response;


    /* =====================
       MODIFICATION
    ===================== */

    if (editId) {

      response =
        await fetch(
          `${API}?id=eq.${encodeURIComponent(editId)}`,
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


    } else {


      /* =====================
         NOUVELLE ANNONCE
      ===================== */

      response =
        await fetch(API, {

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

        });

    }


    if (!response.ok) {

      throw new Error(
        await response.text()
      );

    }


    /* =====================
       SUPPRIMER LES PHOTOS
       RETIRÉES LORS D'UNE MODIFICATION
    ===================== */

    if (editId) {

      const removedPhotos =
        oldPhotos.filter(
          photo =>
            isValidPhotoUrl(photo) &&
            !allPhotos.includes(photo)
        );


      if (removedPhotos.length) {

        await deleteStoragePhotos(
          removedPhotos
        );

      }

    }


    alert(
      `✅ Annonce publiée avec succès !\n\n📸 ${allPhotos.length} photo(s) enregistrée(s).`
    );


    reset();

    await loadCars();


  } catch (error) {

    console.error(error);


    alert(
      "❌ Erreur :\n\n" +
      error.message
    );


  } finally {

    button.disabled = false;

    button.innerHTML =
      originalText;

  }

};


/* =========================
   AFFICHER LES ANNONCES
========================= */

function renderAdmin() {

  $("count").textContent =
    cars.length;


  if (!cars.length) {

    $("adminCars").innerHTML =
      "<p>Aucune annonce publiée.</p>";

    return;
  }


  $("adminCars").innerHTML =
    cars.map(car => {

      const photos =
        Array.isArray(car.photos)
          ? car.photos.filter(
              isValidPhotoUrl
            )
          : [];


      return `

        <div class="admin-car">

          <div style="
            display:flex;
            gap:12px;
            align-items:center;
          ">

            ${
              photos[0]
                ? `

                  <img
                    src="${esc(photos[0])}"
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
                📸 ${photos.length} photo(s)
              </small>

            </div>

          </div>


          <div class="admin-actions">

            <button
              onclick="editCar('${esc(car.id)}')"
            >
              ✏️ Modifier
            </button>


            <button
              onclick="deleteCar('${esc(car.id)}')"
              style="
                background:#e64b4b;
                color:white;
              "
            >
              🗑️ Supprimer
            </button>

          </div>

        </div>

      `;

    }).join("");
}


/* =========================
   MODIFIER
========================= */

function editCar(id) {

  const car =
    cars.find(
      c =>
        String(c.id) ===
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


  /*
    IMPORTANT :
    On ne garde que les vrais liens
    Supabase Storage.
  */

  existingPhotos =
    Array.isArray(car.photos)
      ? car.photos.filter(
          isValidPhotoUrl
        )
      : [];


  selectedPhotos = [];


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
   + SES PHOTOS
========================= */

async function deleteCar(id) {

  if (
    !confirm(
      "Supprimer définitivement cette annonce et toutes ses photos ?"
    )
  ) {

    return;

  }


  try {

    const car =
      cars.find(
        c =>
          String(c.id) ===
          String(id)
      );


    const photosToDelete =
      Array.isArray(car?.photos)
        ? car.photos.filter(
            isValidPhotoUrl
          )
        : [];


    /* =====================
       SUPPRIMER L'ANNONCE
    ===================== */

    const response =
      await fetch(
        `${API}?id=eq.${encodeURIComponent(id)}`,
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


    /* =====================
       SUPPRIMER LES PHOTOS
       DU STORAGE
    ===================== */

    if (photosToDelete.length) {

      await deleteStoragePhotos(
        photosToDelete
      );

    }


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
   RESET
========================= */

function reset() {

  selectedPhotos.forEach(photo => {

    if (photo.preview) {

      URL.revokeObjectURL(
        photo.preview
      );

    }

  });


  selectedPhotos = [];

  existingPhotos = [];


  $("carForm").reset();


  $("editId").value = "";


  $("formTitle").textContent =
    "Ajouter un véhicule";


  preview();

}


$("cancel").onclick = reset;


preview();
