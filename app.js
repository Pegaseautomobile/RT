const KEY="pegaseCars";
const defaultCars=[];

function getCars(){
  try{
    return JSON.parse(localStorage.getItem(KEY))||defaultCars;
  }catch{
    return defaultCars;
  }
}

function render(){
  const q=(document.querySelector("#search")?.value||"").toLowerCase();
  const f=document.querySelector("#fuel")?.value||"";

  const list=getCars().filter(c=>
    (`${c.brand} ${c.model}`.toLowerCase().includes(q)) &&
    (!f||c.fuel===f)
  );

  const box=document.querySelector("#cars");
  if(!box)return;

  box.innerHTML=list.map(c=>`
    <article class="car">
      <div class="car-img">
        ${c.photos?.[0]?`<img src="${c.photos[0]}" alt="${c.brand} ${c.model}">`:""}
      </div>

      <div class="car-body">
        <h3>${esc(c.brand)} ${esc(c.model)}</h3>
        <div class="price">${esc(c.price)}</div>

        <div class="meta">
          <span>${esc(c.year)}</span>
          <span>${esc(c.km)}</span>
          <span>${esc(c.fuel)}</span>
          <span>${esc(c.gear||"")}</span>
        </div>

        <p>${esc(c.description||"")}</p>

        <a class="btn green call" href="tel:+33643486124">
          📞 Mettre en relation avec le vendeur
        </a>
      </div>
    </article>
  `).join("");

  document.querySelector("#empty").hidden=list.length>0;
}

function esc(v){
  return String(v??"").replace(/[&<>"']/g,m=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}

document.querySelector("#search")?.addEventListener("input",render);
document.querySelector("#fuel")?.addEventListener("change",render);

document.querySelector("#year").textContent=new Date().getFullYear();

render();
