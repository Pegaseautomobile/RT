const CODE = "Pégase123";
const KEY = "pegaseCars";

let cars = JSON.parse(localStorage.getItem(KEY) || "[]");
let selectedPhotos = [];

const $ = id => document.getElementById(id);

$("loginBtn").onclick = () => {
  if ($("code").value === CODE) {
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
  renderAdmin();
}

if (sessionStorage.getItem("pegaseAdmin") === "1") {
  show();
}

$("photos").onchange = async e => {
  selectedPhotos = await Promise.all(
    [...e.target.files].map(
      file =>
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
    .map(x => `<img src="${x}">`)
    .join("");
}

$("carForm").onsubmit = e => {
  e.preventDefault();

  const id = $("editId").value || Date.now().toString();
  const old = cars.find(c => c.id === id);

  const car = {
    id,
    brand: $("brand").value,
    model: $("model").value,
    price: $("price").value,
    year: $("year").value,
    km: $("km").value,
    fuel: $("carFuel").value,
    gear: $("gear").value,
    location: $("location").value,
    description: $("description").value,
    photos: selectedPhotos.length
      ? selectedPhotos
      : old?.photos || []
  };

  cars = cars.filter(c => c.id !== id);
  cars.push(car);

  save();
  reset();
  renderAdmin();
};

function save() {
  localStorage.setItem(KEY, JSON.stringify(cars));
}

function renderAdmin() {
  $("count").textContent = cars.length;

  $("adminCars").innerHTML = cars
    .map(
      c => `
      <div class="admin-car">

        <div style="display:flex;gap:12px;align-items:center">

          ${
            c.photos?.[0]
              ? `<img src="${c.photos[0]}">`
              : ""
          }

          <div>
            <b>${esc(c.brand)} ${esc(c.model)}</b>
            <br>
            <span>${esc(c.price)}</span>
          </div>

        </div>

        <div class="admin-actions">

          <button onclick="editCar('${c.id}')">
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
    `
    )
    .join("");
}

function editCar(id) {
  const c = cars.find(x => x.id === id);

  if (!c) return;

  $("editId").value = c.id;
  $("brand").value = c.brand;
  $("model").value = c.model;
  $("price").value = c.price;
  $("year").value = c.year;
  $("km").value = c.km;
  $("carFuel").value = c.fuel;
  $("gear").value = c.gear;
  $("location").value = c.location;
  $("description").value = c.description;

  selectedPhotos = c.photos || [];

  preview();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function deleteCar(id) {
  if (confirm("Supprimer définitivement cette annonce ?")) {
    cars = cars.filter(c => c.id !== id);
    save();
    renderAdmin();
  }
}

function reset() {
  $("carForm").reset();
  $("editId").value = "";
  selectedPhotos = [];
  preview();
}

$("cancel").onclick = reset;

function esc(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    m =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[m]
  );
}
