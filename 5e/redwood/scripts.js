
function fetchJSONData() {
    fetch('https://projects.sauros.xyz/5e/redwood/redwood.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();  
        })
        .then(data => console.log(data))  
        .catch(error => console.error('Failed to fetch data:', error));
}

function get_stat_modifier(num) {
    return Math.floor((num - 10) / 2);
}

var character_json = fetchJSONData();

for (let ability in character_json["abilities"]) {
    document.getElementById(ability).innerText = character_json["abilities"][ability];
    document.getElementById(ability + "_mod").innerText = get_stat_modifier(character_json["abilities"][ability]);
}

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
