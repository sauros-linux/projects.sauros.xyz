
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

function get_stat_label(stat) {
    switch (stat) {
        case "str":
            return "Strength";
        case "dex":
            return "Dexerity";
        case "con":
            return "Constitution";
        case "int":
            return "Intelligence";
        case "wis":
            return "Wisdom";
        case "cha":
            return "Charisma";
    }
}

function get_stat_modifier(num) {
    return Math.floor((num - 10) / 2);
}

function get_roll(str, type = "normal") {
    var roll_string = "";
    switch (type) {
        case "advantage":
            roll_string = "kh1";
            break;

        case "disadvantage":
            roll_string = "dh1";
            break;

        default:
            break;
    }

    if (str.includes("d")) {
        return roll_string + str;
    }
    else {
        if (type != "normal") {
            return "2d20" + roll_string + str;
        } else {
            return "1d20" + str;
        }
    }
}

function get_rollable_button(label, roll_string) {
    return `<button class="rollable" label="${label}">${roll_string}</button>`;
}

function get_roll_template(button, type = "normal") {
    switch (type) {
        case "advantage":
            return `&{template:default} {{name=${document.getElementById("name").innerText}}} {{${button.getAttribute("label")}=[[${get_roll(button.innerText, "advantage")}]]}}`;
        case "disadvantage":
            return `&{template:default} {{name=${document.getElementById("name").innerText}}} {{${button.getAttribute("label")}=[[${get_roll(button.innerText, "disadvantage")}]]}}`;
        default:
            return `&{template:default} {{name=${document.getElementById("name").innerText}}} {{${button.getAttribute("label")}=[[${get_roll(button.innerText)}]]}}`;
    }
}

function send_roll(button, type = "normal") {
    window.postMessage({
        type: "custom20",
        message: get_roll_template(button, type),
    }, "*")
}

async function init() {
    var character_json = await getData("https://projects.sauros.xyz/5e/orbeck/character.json");

    document.getElementById("name").innerText = character_json["name"];

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
        document.getElementById(ability + "_mod").innerHTML = get_rollable_button(`${get_stat_label(ability)}`, (mod >= 0 ? "+" : "") + mod.toString());
        document.getElementById(ability + "_save").innerHTML = get_rollable_button(`${get_stat_label(ability)} Save`, (mod >= 0 ? "+" : "") + mod.toString());
    }

    var rollable_buttons = document.getElementsByClassName("rollable");

    for (let i = 0; i < rollable_buttons.length; i++) {
        rollable_buttons[i].setAttribute("id", `rollable_${i}`);
        rollable_buttons[i].addEventListener("click", function(e) {
            window.postMessage({
                type: "custom20",
                message: get_roll_template(rollable_buttons[i]),
            }, "*")
        });
        rollable_buttons[i].addEventListener('contextmenu', function(e) {
            e.preventDefault();
            let menu = document.createElement("div");
            menu.id = "ctxmenu";
            menu.style = `position: absolute; top:${e.pageY}px; left:${e.pageX}px;`
            menu.innerHTML = `<table style="width: 50px;">
                <tr><button onclick="send_roll(document.getElementById('rollable_${i}'));                 this.parentNode.parentNode.removeChild(this.parentNode)">Normal</button></tr>
                <tr><button onclick="send_roll(document.getElementById('rollable_${i}'), 'advantage');    this.parentNode.parentNode.removeChild(this.parentNode)">Advantage</button></tr>
                <tr><button onclick="send_roll(document.getElementById('rollable_${i}'), 'disadvantage'); this.parentNode.parentNode.removeChild(this.parentNode)">Disadvantage</button></tr>
                <tr><button onclick="this.parentNode.parentNode.removeChild(this.parentNode)">Cancel</button></tr>
            </table>`;
            document.body.appendChild(menu);
        });
    }
}

window.onload = init;
