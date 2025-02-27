
async function getData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
    
        const json = await response.json();
        return json;
    } catch (error) {
        console.error(error.message);
    }
}

function get_stat_modifier(num) {
    return Math.floor((num - 10) / 2);
}

function get_roll(str) {
    if (str.includes("d"))
        return str;
    else
        return "1d20" + str;
}

var attack = document.getElementsByClassName("attack");
var to_hit = document.getElementsByClassName("to_hit");
var damage = document.getElementsByClassName("damage");

for (let i = 0; i < to_hit.length; i++) {
    to_hit[i].addEventListener("click", function(e) {
        window.postMessage({
            type: "custom20",
            message: `&{template:default} {{name=${attack[i].innerText}}} {{To Hit=[[${get_roll(to_hit[i].innerText)}]]}}`,
        }, "*")
    });
}

for (let i = 0; i < to_hit.length; i++) {
    damage[i].addEventListener("click", function(e) {
        window.postMessage({
            type: "custom20",
            message: `&{template:default} {{name=${attack[i].innerText}}} {{Damage=[[${get_roll(damage[i].innerText)}]]}}`,
        }, "*")
    });
}

async function init() {
    var character_json = await getData("https://projects.sauros.xyz/5e/redwood/redwood.json");

    for (let ability in character_json["abilities"]) {
        var base_score = character_json["abilities"][ability];

        character_json["background"]["features"].forEach(feature => {
            try {
                feature["modifiers"].forEach(modifier => {
                    
                    if (modifier["type"] == "asi") {
                        console.log(modifier);
                    }

                    if (modifier["type"] == "asi" && ability in modifier["asi"]) {
                        base_score += modifier["asi"][ability];
                    }
                });
            } catch {
                
            }
        });

        character_json["species"]["features"].forEach(feature => {
            try {
                feature["modifiers"].forEach(modifier => {
                    if (modifier["type"] == "asi" && ability in modifier["asi"]) {
                        base_score += modifier["asi"][ability];
                    }
                });
            } catch {
                
            }
        });

        document.getElementById(ability).innerText = base_score;

        var mod = get_stat_modifier(base_score);
        document.getElementById(ability + "_mod").innerText = (mod >= 0 ? "+" : "") + mod.toString();
    }
}

window.onload = init;
