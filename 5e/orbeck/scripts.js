
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

function add_sign(value) {
    if (value >= 0)
        return `+${value}`;
    else
        return `-${value}`;
}

function has_feature(feature_name) {
    for (var i = 0; i < character["class"].length; i++) {
        for (var j = 0; j < character["class"][i]["features"].length; j++) {
            if (character["class"][i]["features"][j]["name"] == feature_name && character["class"][i]["level"] >= character["class"][i]["features"][j]["level"])
                return true;
        }
    }

    return false;
}

function has_spell(spell_name) {
    for (const character_class of character["class"]) {
        for (const feature of character_class["features"]) {
            if (feature["type"] == "spellcasting" && "spells" in feature) {
                for (const spell of feature["spells"]) {
                    if (spell[1] == spell_name) {
                        return true;
                    }
                }
            }

            if (feature["type"] == "feat" && "spells" in feature["feat"]) {
                for (const spell of feature["feat"]["spells"]) {
                    if (spell[1] == spell_name) {
                        return true;
                    }
                }
            }
        }
    }
    
    return false;
}

function get_armor_class() {
    var base_ac = 10;
    var modifier = get_stat_modifier(get_stat("dex"));

    if (document.getElementById("mage_armor").checked)
        base_ac = 13;

    if (has_feature("Bladesong") && document.getElementById("bladesong").checked)
        modifier += get_stat_modifier(get_stat("int"));

    return base_ac + modifier;
}

function get_character_level() {
    var level = 0;
    for (var i = 0; i < character["class"].length; i++) {
        level += character["class"][i]["level"];
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
        
        case 2:
            if (level <= 2)
                return 0;
            else if (level == 3)
                return 2;
            else
                return 3;

        case 3:
            if (level <= 4)
                return 0;
            else if (level == 5)
                return 2;
            else
                return 3;

        case 4:
            if (level <= 6)
                return 0;
            else if (level == 7)
                return 1;
            else if (level == 8)
                return 2;
            else
                return 3;

        case 5:
            if (level <= 8)
                return 0;
            else if (level == 9)
                return 1;
            else if (level <= 17)
                return 2;
            else
                return 3;

        case 6:
            if (level <= 10)
                return 0;
            else if (level <= 18)
                return 1;
            else
                return 2;

        case 7:
            if (level <= 12)
                return 0;
            else if (level <= 19)
                return 1;
            else
                return 2;

        case 8:
            if (level <= 14)
                return 0;
            else
                return 1;

        case 9:
            if (level <= 16)
                return 0;
            else
                return 1;
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

function get_rollable_button(label, type, roll_string) {
    return `<button class="rollable" label="${label}" type="${type}">${roll_string}</button>`;
}

function get_roll_template(button, type = "normal") {
    switch (type) {
        case "advantage":
            return `&{template:default} {{name=${button.getAttribute("label")} (${document.getElementById("name").innerText})}} {{${button.getAttribute("label")}=[[${get_roll(button.innerText, "advantage")}]]}}`;
        case "disadvantage":
            return `&{template:default} {{name=${button.getAttribute("label")} (${document.getElementById("name").innerText})}} {{${button.getAttribute("label")}=[[${get_roll(button.innerText, "disadvantage")}]]}}`;
        default:
            return `&{template:default} {{name=${button.getAttribute("label")} (${document.getElementById("name").innerText})}} {{${button.getAttribute("label")}=[[${get_roll(button.innerText)}]]}}`;
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

async function parse_character() {
    var attacks = [];

    document.getElementById("name").innerText = character_json["name"];

    for (let ability in character_json["abilities"]) {
        var base_score = character["ability_scores"][abilityFromString(ability)];

        character["background"]["features"].forEach(feature => {
            if ("asi" in feature && ability in feature["asi"]) {
                base_score += feature["asi"][ability];
            } else if ("feat" in feature && "asi" in feature["feat"] && ability in feature["feat"]["asi"]) {
                base_score += feature["feat"]["asi"][ability];
            }
        });

        for (const character_class of character["class"]) {
            character_class["features"].forEach(feature => {
                if ("asi" in feature && ability in feature["asi"]) {
                    base_score += feature["asi"][ability];
                } else if ("feat" in feature && "asi" in feature["feat"] && ability in feature["feat"]["asi"]) {
                    base_score += feature["feat"]["asi"][ability];
                }
            });
        }

        character_json["species"]["features"].forEach(feature => {
            if ("asi" in feature && ability in feature["asi"]) {
                base_score += feature["asi"][ability];
            } else if ("feat" in feature && "asi" in feature["feat"] && ability in feature["feat"]["asi"]) {
                base_score += feature["feat"]["asi"][ability];
            } else if ("speed" in feature) {
                document.getElementById("walk_speed").innerText = `${modifier["speed"]["name"]}: ${modifier["speed"]["speed"]} ft.`;
            }
        });

        character["features"].forEach(feature => {
            if ("asi" in feature && ability in feature["asi"]) {
                base_score += feature["asi"][ability];
            } else if ("feat" in feature && "asi" in feature["feat"] && ability in feature["feat"]["asi"]) {
                base_score += feature["feat"]["asi"][ability];
            }
        });

        document.getElementById(ability).innerText = base_score;

        var mod = get_stat_modifier(base_score);
        document.getElementById(ability + "_mod").innerHTML = get_rollable_button(`${get_stat_label(ability)}`, "", (mod >= 0 ? "+" : "") + mod.toString());
        document.getElementById(ability + "_save").innerHTML = get_rollable_button(`${get_stat_label(ability)}`, "Save", (mod >= 0 ? "+" : "") + mod.toString());
    }

    document.getElementById("prof").innerHTML           = get_rollable_button(`Proficiency Bonus`, "", (get_proficiency_bonus() >= 0 ? "+" : "") + get_proficiency_bonus().toString());    
    document.getElementById("inspiration").innerHTML    = `<input type="checkbox">`;

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
                <td></td>
                <td>${attack["name"]}</td>
                <td></td>
                <td></td>
                <td><button label="${attack["name"]}" type="To Hit" class="rollable">${attack["to_hit"]}</button></td>
                <td><button label="${attack["name"]}" type="Damage" class="rollable">${attack["damage"]}</button></td>
            </tr>`;
    });

    document.getElementById("spells").children[0].innerHTML += `<tr>
                <td colspan="5"><b>CANTRIPS</b></td>
                <td></td>
            </tr>`;

    let spells = [];
    for (const character_class of character["class"]) {        
        for (const feature of character_class["features"]) {
            if (feature["type"] == "spellcasting" && "spells" in feature) {
                var spellcasting_ability = feature["spellcasting_ability"];

                for (const spell of feature["spells"]) {
                    let class_spell = await get_spell(spell[0], spell[1]);
                    class_spell.casting_stat = get_stat(abilityToString(spellcasting_ability, true).toLowerCase());
                    class_spell.proficiency_bonus = character.getProficiencyBonus();
                    class_spell.prepared = spell[2] ?? false;
            
                    spells.push(class_spell);
                }
            }

            if (feature["type"] == "feat" && "spells" in feature["feat"]) {
                var spellcasting_ability = feature["feat"]["spellcasting_ability"];

                for (const spell of feature["feat"]["spells"]) {
                    let class_spell = await get_spell(spell[0], spell[1]);
                    class_spell.casting_stat = get_stat(abilityToString(spellcasting_ability, true).toLowerCase());
                    class_spell.proficiency_bonus = character.getProficiencyBonus();
                    class_spell.prepared = spell[2] ?? false;
            
                    spells.push(class_spell);
                }
            }
        }
    }

    spells.sort((a, b) => a.level - b.level);

    var previous_spell_level = 0;
    spells.forEach(spell => {
        if (spell["level"] != previous_spell_level) {
            previous_spell_level = spell["level"];

            document.getElementById("spells").children[0].innerHTML += `<tr>
                <td colspan="5"><b>LEVEL ${spell["level"]} SPELLS</b></td>
                <th><input type="number" min="0" max="${get_max_spell_slots(spell["level"])}" value="${get_max_spell_slots(spell["level"])}"/></th>
            </tr>`;
        }
        document.getElementById("spells").children[0].innerHTML += spell.toShortHTML();
    });

    if (has_spell("Mage Armor")) {
        document.getElementById("ac_table").innerHTML += `<tr>
            <td>
                <label for="mage_armor">Mage Armor?</label>
                <input type="checkbox" id="mage_armor" name="mage_armor" onchange="document.getElementById('armor_class').innerText = get_armor_class()">
            </td>
        </tr>`;
    }
    
    if (has_feature("Bladesong")) {
        document.getElementById("ac_table").innerHTML += `<tr>
            <td>
                <label for="bladesong">Bladesong?</label>
                <input type="checkbox" id="bladesong" name="bladesong" onchange="document.getElementById('armor_class').innerText = get_armor_class()">
            </td>
        </tr>`;
    }
    
    document.getElementById("ac_table").innerHTML += `<tr>
                                <td>
                                    <span class="stat_modifier" id="armor_class"></span>
                                </td>
                            </tr>`;
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
}

function roll(e) {
    window.postMessage({
        type: "custom20",
        message: e.target.getAttribute("text"),
    }, "*")
}

async function init() {
    character_json = await getData("https://projects.sauros.xyz/5e/orbeck/character.json");
    parse_character();
}

window.onload = init;
