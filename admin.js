smooth"
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
