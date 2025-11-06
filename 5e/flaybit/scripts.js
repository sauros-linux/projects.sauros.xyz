
var character = {};
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

function open_load_window() {
    document.getElementById("input").style.display = "block";

    document.getElementById("input").style.width = "90%";
    document.getElementById("input").style.minWidth = "500px";
}

function close_load_window() {
    document.getElementById("input").style.display = "none";
}

function load_character() {
    let character_json_file = document.getElementById("character_json_file").files[0];
    let character_json_text = document.getElementById("character_json_text").value;

    const reader = new FileReader();
    reader.onload = function() {
        character_json = JSON.parse(reader.result);

        character = Object.assign(new Character(), character_json);

        console.log(character);
        
        parse_character();
    };

    if (character_json_file != null) {
        reader.readAsText(character_json_file);
    } else if (character_json_text != null) {
        character_json = JSON.parse(character_json_text);

        character = Object.assign(new Character(), character_json);

        console.log(character);
        
        parse_character();
    }
}

function save_character() {
    let string = JSON.stringify(character_json);

    navigator.clipboard.writeText(string);
    alert("Copied to clipboard!");
}

function add_sign(value) {
    if (value >= 0)
        return `+${value}`;
    else
        return `-${value}`;
}

async function get_armor_class() {

    var base_ac = 10;
    var modifier = get_stat_modifier(get_stat("dex"));

    for (var i = 0; i < character["equipment"].length; i++) {
        if (character["equipment"][i]["type"] == "light_armor") {
            base_ac = character["equipment"][i]["base_ac"];
        } else if (character["equipment"][i]["type"] == "medium_armor") {
            base_ac = character["equipment"][i]["base_ac"];
            modifier = Math.min(modifier, 2);
        }
    }

    if (await has_spell("Mage Armor")) {
        if (document.getElementById("mage_armor").checked)
            base_ac = 13;
    }

    if (await has_spell("Bladesong")) {
        if (document.getElementById("bladesong").checked)
            modifier += get_stat_modifier(get_stat("int"));
    }

    return base_ac + modifier;
}

function get_character_level() {
    var level = 0;
    for (var i = 0; i < character["class"].length; i++) {
        level += character["class"][i]["level"];
    }
    return level;
}

function get_features() {
    var features = [];

    for (const character_class of character["class"]) {
        if ("features" in character_class) {
            for (const feature of character_class["features"]) {
                features.push(feature);
            }
        }
    }

    for (const item of character["equipment"]) {
        if ("features" in item) {
            for (const feature of item["features"]) {
                features.push(feature);
            }
        }
    }

    for (const feature of character["background"]["features"]) {
        features.push(feature);
    }

    for (const feature of character["features"]) {
        features.push(feature);
    }

    return features;
}

function get_initiative_bonus() {
    return get_stat_modifier(get_stat("dex"));
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
    return (Math.round((get_character_level() + 1) / 4) + 1);
}

function get_skill_modifier(skill) {
    let features = get_features();

    let base_modifier = 0;
    switch (skill) {
        case "Athletics":
            base_modifier = get_stat_modifier(get_stat("str"));
            break;
        case "Acrobatics":
        case "Sleight of Hand":
        case "Stealth":
            base_modifier = get_stat_modifier(get_stat("dex"));
            break;
        case "Arcana":
        case "History":
        case "Investigation":
        case "Nature":
        case "Religion":
            base_modifier = get_stat_modifier(get_stat("int"));
            break;
        case "Animal Handling":
        case "Insight":
        case "Medicine":
        case "Perception":
        case "Survival":
            base_modifier = get_stat_modifier(get_stat("wis"));
            break;
        case "Deception":
        case "Intimidation":
        case "Performance":
        case "Persuasion":
            base_modifier = get_stat_modifier(get_stat("cha"));
            break;
    }

    let modifier = base_modifier + (is_proficient(skill) ? get_proficiency_bonus() : 0);
    modifier += (is_expert(skill) ? get_proficiency_bonus() : 0);

    features.forEach(feature => {
        if ("bonus" in feature) {
            feature["bonus"].forEach(bonus => {
                if (bonus["ability"] == skill) {
                    modifier += bonus["bonus"];
                }
            });
        }
    });

    return modifier;
}

function get_stat(stat) {
    return parseInt(document.getElementById(stat).innerText);
}

function get_stat_label(stat) {
    switch (stat) {
        case "str":
            return "Strength";
        case "dex":
            return "Dexterity";
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

function get_rollable_button(title, label, type, roll_string) {
    return `<button class="rollable" title=${title} label="${label}" type="${type}">${roll_string}</button>`;
}

function get_roll_template(button, type = "normal") {
    switch (type) {
        case "advantage":
            return `&{template:default} {{name=${button.getAttribute("title")} (${document.getElementById("name").innerText})}} {{${button.getAttribute("label")}=[[${get_roll(button.innerText, "advantage")}]]}}`;
        case "disadvantage":
            return `&{template:default} {{name=${button.getAttribute("title")} (${document.getElementById("name").innerText})}} {{${button.getAttribute("label")}=[[${get_roll(button.innerText, "disadvantage")}]]}}`;
        default:
            return `&{template:default} {{name=${button.getAttribute("title")} (${document.getElementById("name").innerText})}} {{${button.getAttribute("label")}=[[${get_roll(button.innerText)}]]}}`;
    }
}

function get_non_roll_template(button) {
    return `&{template:default} {{name=${document.getElementById("name").innerText}}} {{${button.getAttribute("label")}=${button.innerText}}} {{Description=${button.getAttribute("description")}}}`;
}

function has_feature(feature_name) {
    for (const feature of get_features()) {
        if (feature["name"] == feature_name) {
            return true;
        }
    }

    return false;
}

async function has_spell(spell_name) {
    let spells = await parse_spells();
    for (let i = 0; i < spells.length; i++) {
        if (spells[i].name == spell_name) {
            return true;
        }
    }
    
    return false;
}

function is_expert(skill) {
    for (const feature of get_features()) {
        if ("expertise" in feature && feature["expertise"].includes(skill)) {
            return true;
        }
    }

    return false;
}

function is_proficient(skill) {
    for (const feature of get_features()) {
        if ("proficiencies" in feature && feature["proficiencies"].includes(skill)) {
            return true;
        }
    }

    return false;
}

function open_tab(tab) {
    var i;
    var x = document.getElementsByClassName("tab");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    document.getElementById(tab).style.display = "block";
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

async function parse_attacks(spells) {

    var attacks = [];

    for (var i = 0; i < character_json["equipment"].length; i++) {
        try {
            var item = character_json["equipment"][i];

            if (item["type"] == "melee_weapon" || item["type"] == "ranged_weapon") {
                var attack_mod = "str";
                if (item["properties"].includes("Finesse")) {
                    var str_score = get_stat("str");
                    var dex_score = get_stat("dex");

                    if (dex_score > str_score)
                        attack_mod = "dex";
                } else if (item["properties"].includes("Range")) {
                    attack_mod = "dex";
                }

                to_hit_roll = new Roll();
                // if proficient
                    to_hit_roll.modifiers.push(get_proficiency_bonus());

                if (has_feature("Bladesong") && document.getElementById("bladesong") != null && document.getElementById("bladesong").checked) {
                    var str_score = get_stat("str");
                    var dex_score = get_stat("dex");
                    var int_score = get_stat("int");

                    if (int_score > str_score && int_score > dex_score)
                        attack_mod = "int";
                }

                attack_mod = get_stat_modifier(get_stat(attack_mod));
                to_hit_roll.modifiers.push(attack_mod);

                if (item["properties"].includes("+1"))
                    attack_mod += 1;
                if (item["properties"].includes("+2"))
                    attack_mod += 2;
                if (item["properties"].includes("+3"))
                    attack_mod += 3;

                let damage_rolls = [];
                for (var j = 0; j < item["damage"].length; j++) {
                    damage_roll = new Roll();
                    damage_roll.dice = item["damage"][j]["dice"];
                    damage_roll.num = item["damage"][j]["num"];
                    // if proficient
                        damage_roll.modifiers.push(attack_mod);

                    damage_rolls.push(damage_roll.toString());
                }

                attacks.push({
                    "name": item["name"],
                    "to_hit": to_hit_roll.toString(),
                    "damage": damage_rolls,
                });

                let true_strike = spells.find((spell) => spell.name == "True Strike");
                if (true_strike != null) {
                    let spellcasting_mod = Math.floor((true_strike.casting_stat - 10) / 2);
                    
                    to_hit_roll_spell = new Roll();
                    // if proficient
                        to_hit_roll_spell.modifiers.push(get_proficiency_bonus());
                    to_hit_roll_spell.modifiers.push(spellcasting_mod);

                    let damage_rolls_spell = [];
                    for (var j = 0; j < item["damage"].length; j++) {
                        damage_roll_spell = new Roll();
                        damage_roll_spell.dice = item["damage"][j]["dice"];
                        damage_roll_spell.num = item["damage"][j]["num"];
                        // if proficient
                            damage_roll_spell.modifiers.push(spellcasting_mod);

                        damage_rolls_spell.push(damage_roll_spell.toString());
                    }

                    attacks.push({
                        "name": "True Strike",
                        "weapon": item["name"],
                        "to_hit": to_hit_roll_spell.toString(),
                        "damage": damage_rolls_spell,
                    });
                }

                if (item["type"] != "ranged_weapon") {
                    let green_flame_blade = spells.find((spell) => spell.name == "Green-Flame Blade");
                    let booming_blade = spells.find((spell) => spell.name == "Booming Blade");

                    if (green_flame_blade != null || booming_blade != null) {
                        
                        let damage_rolls_spell = [];
                        for (var j = 0; j < item["damage"].length; j++) {
                            damage_roll_spell = new Roll();
                            damage_roll_spell.dice = item["damage"][j]["dice"];
                            damage_roll_spell.num = item["damage"][j]["num"];
                            // if proficient
                                damage_roll_spell.modifiers.push(attack_mod);
                            
                            if (get_character_level() >= 5) {
                                let extra_damage_roll = new Roll();
                                extra_damage_roll.dice = DICE.D8;
                                if (get_character_level() >= 17) {
                                    extra_damage_roll.num = 3;
                                } else if (get_character_level() >= 11) {
                                    extra_damage_roll.num = 2;
                                } else if (get_character_level() >= 5) {
                                    extra_damage_roll.num = 1;
                                }
                                damage_roll_spell.extra_rolls.push(extra_damage_roll);
                            }

                            damage_rolls_spell.push(damage_roll_spell.toString());
                            if (booming_blade != null) {
                                let extra_damage_roll = new Roll();
                                extra_damage_roll.dice = DICE.D8;
                                extra_damage_roll.num = 1;
                                if (get_character_level() >= 17) {
                                    extra_damage_roll.num = 4;
                                } else if (get_character_level() >= 11) {
                                    extra_damage_roll.num = 3;
                                } else if (get_character_level() >= 5) {
                                    extra_damage_roll.num = 2;
                                }
                                damage_rolls_spell.push(extra_damage_roll);
                            }
                        }

                        if (green_flame_blade != null) {
                            let spellcasting_mod_damage = new Roll();
                            spellcasting_mod_damage.modifiers.push(Math.floor((green_flame_blade.casting_stat - 10) / 2));

                            damage_rolls_spell.push(spellcasting_mod_damage);
                        }

                        attacks.push({
                            "name": green_flame_blade != null ? "Green-Flame Blade" : "Booming Blade",
                            "weapon": item["name"],
                            "to_hit": to_hit_roll.toString(),
                            "damage": damage_rolls_spell,
                        });
                    }
                }
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
        "damage": [ get_stat_modifier(get_stat("str")) + 1 ],
    });

    return attacks;
}

async function parse_inventory() {
    for (let key in character_json["inventory"]) {
        document.getElementById("inventory").children[0].innerHTML += `<tr>
                <td colspan="6"><b>${key.toUpperCase()}</b></td>
            </tr>`;

        let weight = 0.0;
        let gp = 0.0;
        
        for (var i = 0; i < character_json["inventory"][key].length; i++) {
            let item = character_json["inventory"][key][i];

            document.getElementById("inventory").children[0].innerHTML += `<tr>
                <td>x${item[3]}</td>
                <td colspan="3" class="action_label">${item[1]}</td>
                <td>${item[2]}</td>
                <td>${item[4]}</td>
            </tr>`;

            weight += item[2] * item[3];
            gp += item[4] * item[3];
        }

        document.getElementById("inventory").children[0].innerHTML += `<tr>
                <td colspan="4">Total</td>
                <td>${weight} lbs.</td>
                <td>${gp} GP</td>
            </tr>`;
    }
}

async function parse_spells() {
    let spells = [];

    for (const feature of character["background"]["features"]) {
        if ("feat" in feature && "spells" in feature["feat"] && feature["feat"]["spells"].length > 0) {
            var spellcasting_ability = feature["feat"]["spellcasting_ability"];

            for (const spell of feature["feat"]["spells"]) {
                let class_spell = await get_spell(spell[0], spell[1]);
                
                if (class_spell != null) {
                    class_spell.casting_stat = get_stat(abilityToString(spellcasting_ability, true).toLowerCase());
                    class_spell.proficiency_bonus = get_proficiency_bonus();
                    class_spell.prepared = spell[2] ?? false;

                    spells.push(class_spell);
                }
            }
        }
    }
    for (const character_class of character["class"]) {        
        for (const feature of character_class["features"]) {
            if (feature["level"] > character_class["level"])
                continue;

            if ("spells" in feature && feature["spells"].length > 0) {
                var spellcasting_ability = feature["spellcasting_ability"];

                for (const spell of feature["spells"]) {
                    let class_spell = await get_spell(spell[0], spell[1]);

                    if (class_spell != null) {
                        class_spell.casting_stat = get_stat(abilityToString(spellcasting_ability, true).toLowerCase());
                        class_spell.proficiency_bonus = get_proficiency_bonus();
                        class_spell.prepared = spell[2] ?? false;

                        spells.push(class_spell);
                    }
                }
            }

            if ("feat" in feature && "spells" in feature["feat"] && feature["feat"]["spells"].length > 0) {
                var spellcasting_ability = feature["feat"]["spellcasting_ability"];

                for (const spell of feature["feat"]["spells"]) {
                    let class_spell = await get_spell(spell[0], spell[1]);
                    console.log(class_spell);
                    if (class_spell != null) {
                        class_spell.casting_stat = get_stat(abilityToString(spellcasting_ability, true).toLowerCase());
                        class_spell.proficiency_bonus = get_proficiency_bonus();
                        class_spell.prepared = spell[2] ?? false;
                
                        spells.push(class_spell);
                    }
                }
            }
        }
    }

    spells.sort((a, b) => (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0);
    spells.sort((a, b) => a.level - b.level);

    return spells;
}

async function parse_character() {

    console.log(character_json);

    let abilities = [
        "str", "dex", "con", "int", "wis", "cha"
    ];

    document.getElementById("name").innerText = character_json["name"];

    document.getElementById("background").innerText = character_json["background"]["name"];

    // parse classes
    for (let i = 0; i < character_json["class"].length; i++) {
        let current_class = character_json["class"][i];
        let features = "";

        for (let j = 0; j < current_class["features"].length; j++) {
            let current_feature = current_class["features"][j];

            features += `<tr>
                <td style="text-align: left;">
                    <h3>${current_feature["name"]}</h3>
                    <p>${render_description(current_feature["description"] ?? "", "</p><p>")}</p>
                </td>
            </tr>`;
        }

        document.getElementById("class-features").innerHTML += `<div class="flex">
                            <table class="collapsible">
                                <tr><th>${current_class["name"]} Features</th></tr>
                                ${features}
                            </table>
                        </div>`;
    }

    document.getElementById("species").innerText = character_json["species"]["name"];
    document.getElementById("walk_speed").innerText = character_json["species"]["walking_speed"];

    for (const ability of abilities) {
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

        character["species"]["features"].forEach(feature => {
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
        var save = get_stat_modifier(base_score) + (is_proficient(get_stat_label(ability) + " Saving Throws") ? get_proficiency_bonus() : 0) 
        document.getElementById(ability + "_mod").innerHTML = get_rollable_button(`${get_stat_label(ability)}`, `${get_stat_label(ability)}`, "", (mod >= 0 ? "+" : "") + mod.toString());
        document.getElementById(ability + "_save").innerHTML = get_rollable_button(`${get_stat_label(ability)}`, `${get_stat_label(ability)} Save`, "Save", (save >= 0 ? "+" : "") + save.toString());
    }

    document.getElementById("prof").innerHTML           = get_rollable_button(`Proficiency Bonus`, `Proficiency Bonus`, "", (get_proficiency_bonus() >= 0 ? "+" : "") + get_proficiency_bonus().toString());
    document.getElementById("init").innerHTML           = get_rollable_button(`Initiative`, `Initiative`, "", (get_initiative_bonus() >= 0 ? "+" : "") + get_initiative_bonus().toString());
    document.getElementById("inspiration").innerHTML    = `<input type="checkbox">`;
    document.getElementById("current_hp").innerHTML     = `<input type="number">`;
    document.getElementById("max_hp").innerHTML         = `<input type="number">`;
    document.getElementById("temp_hp").innerHTML        = `<input type="number">`;

    let max_hp = 0;
    for (var i = 0; i < character_json["hit_dice"].length; i++) {
        max_hp += character_json["hit_dice"][i] + get_stat_modifier(get_stat("con"));
    }
    document.getElementById("max_hp").children[0].value = max_hp;

    let skills = [
        "Acrobatics",
        "Animal Handling",
        "Arcana",
        "Athletics",
        "Deception",
        "History",
        "Insight",
        "Intimidation",
        "Investigation",
        "Medicine",
        "Nature",
        "Perception",
        "Performance",
        "Persuasion",
        "Religion",
        "Sleight of Hand",
        "Stealth",
        "Survival",
    ];
    for (const SKILL of skills) {
        document.getElementById(`${SKILL.toLowerCase().replaceAll(" ", "_")}_mod`).innerHTML = get_rollable_button(
            SKILL,
            SKILL,
            "",
            (get_skill_modifier(SKILL) < 0 ? "" : "+") + get_skill_modifier(SKILL)
        );
    }
    document.getElementById("passive_perception").innerText     = 10 + get_skill_modifier("Perception");
    document.getElementById("passive_investigation").innerText  = 10 + get_skill_modifier("Investigation");
    document.getElementById("passive_insight").innerText        = 10 + get_skill_modifier("Insight");

    let mage_armor = await has_spell("Mage Armor");
    let bladesong = has_feature("Bladesong");

    if (mage_armor || bladesong) {
        let ac_table = `<p>`;

        if (mage_armor) {
            ac_table += `<label for="mage_armor">Mage Armor?</label>
                <input type="checkbox" id="mage_armor" name="mage_armor" onchange="refresh()">`;
        }
        if (mage_armor && bladesong) {
            ac_table += `</p><p>`;
        }
        if (bladesong) {
            ac_table += `<label for="bladesong">Bladesong?</label>
                <input type="checkbox" id="bladesong" name="bladesong" onchange="refresh()">`;
        }
        ac_table += `</p>`;
        document.getElementById("defenses").innerHTML = ac_table;
    }

    await parse_inventory();

    await refresh();
}

async function refresh() {
    document.getElementById('armor_class').innerText = await get_armor_class();
    await refresh_attacks();
    await refresh_buttons();
}

async function refresh_attacks() {
    let spells = await parse_spells();
    var attacks = await parse_attacks(spells);

    document.getElementById("attacks").parentElement.innerHTML = `<table id="attacks">
                            <tr>
                                <th class="heading" colspan="7">ATTACKS</th>
                            </tr>
                        </table>`;

    document.getElementById("spells").parentElement.innerHTML = `<table id="spells">
                            <tr>
                                <th class="heading" colspan="7">SPELLS</th>
                            </tr>
                            <tr>
                                <td colspan="7">CANTRIPS</td>
                            </tr>
                        </table>`;

    attacks.forEach(attack => {
        let to_hit_buttons = "";
        let damage_buttons = [];
        
        to_hit_buttons = `<button title="${attack["name"]}" label="To Hit" type="To Hit" class="rollable">${attack["to_hit"]}</button>`;
        for (var i = 0; i < attack["damage"].length; i++) {
            damage_buttons.push(`<button title="${attack["name"]}" label="Damage" type="Damage" class="rollable">${attack["damage"][i]}</button>`);
        }

        document.getElementById("attacks").children[0].innerHTML += `<tr>
                <td rowspan="${attack["damage"].length}"></td>
                <th rowspan="${attack["damage"].length}" colspan="4" class="item">${(attack["weapon"] != undefined ? `${attack["weapon"]} (${attack["name"]})` : attack["name"])}</th>
                <td rowspan="${attack["damage"].length}">${to_hit_buttons}</td>
                <td>${damage_buttons[0]}</td>
            </tr>`;
        for (var i = 1; i < attack["damage"].length; i++) {
            document.getElementById("attacks").children[0].innerHTML += `<tr>
                <td>${damage_buttons[i]}</td>
            </tr>`;
        }
        
    });

    var previous_spell_level = 0;
    spells.forEach(spell => {
        if (spell["level"] != previous_spell_level) {
            previous_spell_level = spell["level"];

            document.getElementById("spells").children[0].innerHTML += `<tr>
                <td colspan="6">LEVEL ${spell["level"]} SPELLS</td>
                <th><input type="number" min="0" max="${get_max_spell_slots(spell["level"])}" value="${get_max_spell_slots(spell["level"])}"/></th>
            </tr>`;
        }
        document.getElementById("spells").children[0].innerHTML += spell.toShortHTML();
    });
}

async function refresh_buttons() {
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

function collapsible_on_click(event) {
    event.currentTarget.parentElement.parentElement.classList.toggle("expanded");
}

function update_collapsible(name) {
    if (typeof name == "string") {
        document.getElementById(name).children[0].addEventListener("click", collapsible_on_click);
    } else {
        name.children[0].children[0].addEventListener("click", collapsible_on_click);
    }
}

function update_collapsibles() {
    var coll = document.getElementsByClassName("collapsible");
    var i;

    for (i = 0; i < coll.length; i++) {
        update_collapsible(coll[i]);
    }
}

async function init() {
    character_json = await getData("character.json");
    character = Object.assign(new Character(), character_json);
    
    parse_character();
    update_collapsibles();
}

window.onload = init;
