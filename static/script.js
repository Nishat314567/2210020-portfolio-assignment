const words=["Computer Science Student","Flutter Developer","Web Developer","Problem Solver"];
let wi=0,ci=0,del=false;const el=document.getElementById("type");
(function tick(){const w=words[wi];ci+=del?-1:1;el.textContent=w.slice(0,ci);
let d=del?50:110;if(!del&&ci===w.length){del=true;d=1400}else if(del&&ci===0){del=false;wi=(wi+1)%words.length;d=300}
setTimeout(tick,d)})();
const links=document.getElementById("links");
document.getElementById("menu").onclick=()=>links.classList.toggle("open");
links.querySelectorAll("a").forEach(a=>a.onclick=()=>links.classList.remove("open"));
const secs=[...document.querySelectorAll("section")],as=[...links.querySelectorAll("a")];
addEventListener("scroll",()=>{let c=secs[0].id;secs.forEach(s=>{if(scrollY>=s.offsetTop-120)c=s.id});as.forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+c))});

// ===== CRUD: shob section (API theke data ashe) =====
const API = "/api/";
const DATA = {};   // load kora data ekhane thake

// Protita section er form field
const CFG = {
  skills:   { name: "Skill", fields: [{ k: "name", l: "Skill name", req: 1 }] },
  projects: { name: "Project", fields: [{ k: "title", l: "Project title", req: 1 }, { k: "tech", l: "Tech stack" }, { k: "description", l: "Description (one point per line)", area: 1 }] }
};

function esc(t) { const d = document.createElement("div"); d.textContent = t || ""; return d.innerHTML; }
function acts(t, id) {
  return `<div class="acts"><button class="ed" data-act="edit" data-t="${t}" data-id="${id}">Edit</button><button class="del" data-act="del" data-t="${t}" data-id="${id}">Delete</button></div>`;
}

// READ + page e dekhano
async function loadAll() {
  for (const t in CFG) DATA[t] = await (await fetch(API + t)).json();


  const sk = cat => DATA.skills.filter(x => x.category === cat).map(x =>
    `<span>${esc(x.name)}<b data-act="edit" data-t="skills" data-id="${x.id}">&#9998;</b><b data-act="del" data-t="skills" data-id="${x.id}">&times;</b></span>`).join("");
  document.getElementById("codingList").innerHTML = sk("coding");
  document.getElementById("profList").innerHTML = sk("professional");

  document.getElementById("projectList").innerHTML = DATA.projects.map(p =>
    `<div class="card"><span class="tag">${esc(p.tech)}</span><h4>${esc(p.title)}</h4>
     <ul>${(p.description || "").split("\n").filter(x => x.trim()).map(x => `<li>${esc(x)}</li>`).join("")}</ul>${acts("projects", p.id)}</div>`).join("");

}

// ===== Form (modal) =====
const modal = document.getElementById("modal");
const mform = document.getElementById("mform");
let cur = null;   // { t, id, extra }

function openForm(t, item, extra) {
  cur = { t, id: item ? item.id : null, extra: extra || {} };
  document.getElementById("mtitle").textContent = (item ? "Edit " : "Add ") + CFG[t].name;
  document.getElementById("mfields").innerHTML = CFG[t].fields.map(f =>
    `<label>${f.l}</label>` + (f.area
      ? `<textarea name="${f.k}">${esc(item ? item[f.k] : "")}</textarea>`
      : `<input name="${f.k}" value="${esc(item ? item[f.k] : "")}" ${f.req ? "required" : ""}>`)).join("");
  modal.hidden = false;
}
document.getElementById("mcancel").onclick = () => { modal.hidden = true; };

// CREATE + UPDATE
mform.onsubmit = async e => {
  e.preventDefault();
  const body = { ...cur.extra };
  CFG[cur.t].fields.forEach(f => { body[f.k] = mform.elements[f.k].value; });
  await fetch(API + cur.t + (cur.id ? "/" + cur.id : ""), {
    method: cur.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  modal.hidden = true;
  loadAll();
};

// Add / Edit / Delete button click
document.addEventListener("click", async e => {
  const add = e.target.closest("[data-add]");
  if (add) return openForm(add.dataset.add, null, add.dataset.extra ? JSON.parse(add.dataset.extra) : {});

  const b = e.target.closest("[data-act]");
  if (!b) return;
  const t = b.dataset.t, id = Number(b.dataset.id);
  if (b.dataset.act === "edit") openForm(t, DATA[t].find(x => x.id === id));
  if (b.dataset.act === "del" && confirm("Delete korbe?")) {
    await fetch(API + t + "/" + id, { method: "DELETE" });
    loadAll();
  }
});

loadAll();
