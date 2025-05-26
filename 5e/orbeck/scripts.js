
var character_json = {};

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

class Roll {
    dice = "d20";
    num = "1";
    modifiers = [];
    extra_rolls = [];

    getModifier() {
        var mod = 0;
        this.modifiers.forEach(modifier => {
            mod += modifier;
        });
        return mod;
    }

    getModifierString() {
        var mod = this.getModifier();
        if (mod == 0)
            return "";
        else
            return `${(mod >= 0 ? "+" : "-")}${mod}`;
    }

    toString() {
        var extra_roll_strings = "";
        this.extra_rolls.forEach(extra_roll => {
            extra_roll_strings += `+${extra_roll.toString()}`;
        });
        if (this.dice == "d20")
            return `${this.getModifierString()}${extra_roll_strings}`;
        else
            return `${this.num}${this.dice}${this.getModifierString()}${extra_roll_strings}`;
    }
}

function add_sign(value) {
    if (value >= 0)
        return `+${value}`;
    else
        return `-${value}`;
}

function has_feature(feature) {
    for (var i = 0; i < character_json["class"].length; i++) {
        character_json["class"][i]["features"].forEach(feature => {
            if (feature["name"] == feature)
                return true;
        });
    }

    return false;
}

function has_spell(spell) {
    for (var i = 0; i < character_json["class"].length; i++) {
        if ("spells" in character_json["class"][i]) {
            character_json["class"][i]["spells"].forEach(spell => {
                if (spell["name"] == spell)
                    return true;
            });
        }
    }
    
    return false;
}

function get_armor_class() {
    var base_ac = 10;
    var modifier = get_stat_modifier(get_stat("dex"));

    if (has_spell("Mage Armor") && document.getElementById("mage_armor").checked)
        base_ac = 13;

    if (has_feature("Bladesong") && document.getElementById("bladesong").checked)
        modifier += get_stat_modifier(get_stat("int"));

    return base_ac + modifier;
}

function get_character_level() {
    var level = 0;
    for (var i = 0; i < character_json["class"].length; i++) {
        level += character_json["class"][i]["level"];
    }
    return level;
}

function get_max_spell_slots(spell_level) {
    var level = 0;
    for (var i = 0; i < character_json["class"].length; i++) {
        var class_name = character_json["class"][i]["name"];
        if (class_name == "Bard" ||
            class_name == "Cleric" ||
            class_name == "Druid" ||
            class_name == "Sorcerer" ||
            class_name == "Wizard"
        ) {
            level += character_json["class"][i]["level"];
        } else if (class_name == "Paladin" || class_name == "Ranger") {
            level += character_json["class"][i]["level"] / 2;
        }
    }

    switch (spell_level) {
        case 1:
            if (level <= 1)
                return 2;
            else if (level == 2)
                return 3;
            else
                return 4;
    }

    return level;
}

function get_proficiency_bonus() {
    return Math.round((get_character_level() + 1) / 4) + 1;
}

function get_stat(stat) {
    return parseInt(document.getElementById(stat).innerText);
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

function get_non_roll_template(button) {
    return `&{template:default} {{name=${document.getElementById("name").innerText}}} {{${button.getAttribute("label")}=${button.innerText}}} {{Description=${button.getAttribute("description")}}}`;
}

function render_text(str) {
    var result = str;
    result = result.replace("@PB", `${get_proficiency_bonus()}`);
    result = result.replace("@str", `${get_stat_modifier(get_stat("str"))}`);
    result = result.replace("@dex", `${get_stat_modifier(get_stat("dex"))}`);
    result = result.replace("@con", `${get_stat_modifier(get_stat("con"))}`);
    result = result.replace("@int", `${get_stat_modifier(get_stat("int"))}`);
    result = result.replace("@wis", `${get_stat_modifier(get_stat("wis"))}`);
    result = result.replace("@cha", `${get_stat_modifier(get_stat("cha"))}`);
    return result;
}

function send_roll(button, type = "normal") {
    window.postMessage({
        type: "custom20",
        message: get_roll_template(button, type),
    }, "*")
}

function send_non_roll(button) {
    window.postMessage({
        type: "custom20",
        message: get_non_roll_template(button),
    }, "*")
}

function parse_character() {
    var attacks = [];
    var spells = [];

    document.getElementById("name").innerText = character_json["name"];

    for (let ability in character_json["abilities"]) {
        var base_score = character_json["abilities"][ability];

        character_json["background"]["features"].forEach(feature => {
            try {
                feature["modifiers"].forEach(modifier => {
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
                    else if (modifier["type"] == "speed") {
                        document.getElementById("walk_speed").innerText = `${modifier["speed"]["name"]}: ${modifier["speed"]["speed"]} ft.`;
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

    document.getElementById("prof").innerHTML           = get_rollable_button(`Proficiency Bonus`, (get_proficiency_bonus() >= 0 ? "+" : "") + get_proficiency_bonus().toString());    
    document.getElementById("inspiration").innerHTML    = get_rollable_button(`Proficiency Bonus`, (get_proficiency_bonus() >= 0 ? "+" : "") + get_proficiency_bonus().toString());

    for (var i = 0; i < character_json["equipment"].length; i++) {
        try {
            var item = character_json["equipment"][i];
            
            if (item["type"] == "weapon") {
                var attack_mod = "str";
                if (item["properties"].includes("Finesse")) {
                    var str_score = get_stat("str");
                    var dex_score = get_stat("dex");

                    if (dex_score > str_score)
                        attack_mod = "dex";
                }

                attack_mod = get_stat_modifier(get_stat(attack_mod));

                if (item["properties"].includes("+1"))
                    attack_mod += 1;
                if (item["properties"].includes("+2"))
                    attack_mod += 2;
                if (item["properties"].includes("+3"))
                    attack_mod += 3;

                to_hit_roll = new Roll();
                // if proficient
                    to_hit_roll.modifiers.push(get_proficiency_bonus());
                to_hit_roll.modifiers.push(attack_mod);

                damage_roll = new Roll();
                damage_roll.dice = item["damage"]["dice"];
                damage_roll.num = item["damage"]["num"];
                // if proficient
                    damage_roll.modifiers.push(attack_mod);

                attacks.push({
                    "name": item["name"],
                    "to_hit": to_hit_roll.toString(),
                    "damage": damage_roll.toString(),
                });
            }
        } catch {
            
        }
    }
    to_hit_roll = new Roll();
    to_hit_roll.modifiers.push(get_proficiency_bonus());
    to_hit_roll.modifiers.push(get_stat_modifier(get_stat("str")));

    attacks.push({
        "name": "Unarmed Strike",
        "to_hit": to_hit_roll.toString(),
        "damage": get_stat_modifier(get_stat("str")) + 1,
    });

    attacks.forEach(attack => {
        document.getElementById("attacks").children[0].innerHTML += `<tr>
                <td>${attack["name"]}</td>
                <td><button label="${attack["name"]} (To Hit)" class="rollable">${attack["to_hit"]}</button></td>
                <td><button label="${attack["name"]} (Damage)" class="rollable">${attack["damage"]}</button></td>
            </tr>`;
    });

    document.getElementById("attacks").children[0].innerHTML += `<tr><th colspan="3">CANTRIPS</th></tr>`;

    character_json["class"].forEach(character_class => {
        if ("spells" in character_class) {
            var spellcasting_ability = character_class["features"].find((f) => f["name"] == "Spellcasting")["modifiers"][0]["spellcasting"]["ability"];

            character_class["spells"].forEach(spell => {
                if ("damage" in spell) {
                    to_hit_roll = new Roll();
                    to_hit_roll.modifiers.push(get_proficiency_bonus());
                    to_hit_roll.modifiers.push(get_stat_modifier(get_stat(spellcasting_ability)));

                    damage_roll = new Roll();
                    damage_roll.dice = item["damage"]["dice"];
                    damage_roll.num = item["damage"]["num"];

                    if ("save" in spell) {
                        spells.push({
                            "name": spell["name"],
                            "level": spell["level"],
                            "save": `DC ${8 + get_proficiency_bonus() + get_stat_modifier(get_stat(spellcasting_ability))} ${spell["save"].toUpperCase()}`,
                            "damage": damage_roll.toString(),
                            "description": spell["description"][0],
                        });
                    }
                    else {
                        spells.push({
                            "name": spell["name"],
                            "level": spell["level"],
                            "to_hit": to_hit_roll.toString(),
                            "damage": damage_roll.toString(),
                        });
                    }
                }
            });
        }
    });

    var previous_spell_level = 0;
    spells.forEach(spell => {
        if (spell["level"] != previous_spell_level) {
            previous_spell_level = spell["level"];

            document.getElementById("attacks").children[0].innerHTML += `<tr>
                <th colspan="2">LEVEL ${spell["level"]} SPELLS</th>
                <th><input type="number" min="0" max="${get_max_spell_slots(spell["level"])}" value="${get_max_spell_slots(spell["level"])}"/></th>
            </tr>`;
        }
        if ("to_hit" in spell) {
            var to_hit = eval(render_text(spell["to_hit"]));

            document.getElementById("attacks").children[0].innerHTML += `<tr>
                    <td>${spell["name"]}</td>
                    <td><button label="${spell["name"]} (To Hit)" class="rollable">${add_sign(to_hit)}</button></td>
                    <td><button label="${spell["name"]} (Damage)" class="rollable">${render_text(spell["damage"])}</button></td>
                </tr>`;
        }
        else {
            document.getElementById("attacks").children[0].innerHTML += `<tr>
                    <td>${spell["name"]}</td>
                    <td><button label="${spell["name"]} (Save)" description="${spell["description"]}" class="non_rollable">${spell["save"]}</button></td>
                    <td><button label="${spell["name"]} (Damage)" class="rollable">${render_text(spell["damage"])}</button></td>
                </tr>`;
        }
    });

    document.getElementById("armor_class").innerText = get_armor_class();

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

    var non_rollable_buttons = document.getElementsByClassName("non_rollable");

    for (let i = 0; i < non_rollable_buttons.length; i++) {
        non_rollable_buttons[i].setAttribute("id", `rollable_${i}`);
        non_rollable_buttons[i].addEventListener("click", function(e) {
            window.postMessage({
                type: "custom20",
                message: get_non_roll_template(non_rollable_buttons[i]),
            }, "*")
        });
    }

    document.getElementById("mage_armor").addEventListener("change", function(e) {
        document.getElementById("armor_class").innerText = get_armor_class();
    });
    document.getElementById("bladesong").addEventListener("change", function(e) {
        document.getElementById("armor_class").innerText = get_armor_class();
    });
}

async function init() {
    character_json = await getData("https://projects.sauros.xyz/5e/orbeck/character.json");
    parse_character();
}

window.onload = init;
