
var character = "Hegbast Redwood";

var attack = document.getElementsByClassName("attack");
var to_hit = document.getElementsByClassName("to_hit");
var damage = document.getElementsByClassName("damage");

for (let i = 0; i < to_hit.length; i++) {
    to_hit[i].addEventListener("click", function(e) {
        window.postMessage({
            type: "custom20",
            message: `&{template:default} {{name=${attack[i].innerText}}} {{To Hit=[[${to_hit[i].innerText}]]}}`,
        }, "*")
    });
}

for (let i = 0; i < to_hit.length; i++) {
    damage[i].addEventListener("click", function(e) {
        window.postMessage({
            type: "custom20",
            message: `&{template:default} {{name=${attack[i].innerText}}} {{Damage=[[${damage[i].innerText}]]}}`,
        }, "*")
    });
}
