
function get_book(str) {
    switch (str) {
        case "XPHB":
            return 'Player’s Handbook (2024)';
        case "PHB":
            return 'Player’s Handbook (2014)';
        case "TCE":
            return 'Tasha’s Cauldron of Everything';
        case "XGE":
            return 'Xanathar’s Guide to Everything';
        case "OTTG":
        case "O:TTG":
            return 'Obojima: Tales from the Tall Grass';
    }

    return "";
}

async function get_data(url) {
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

async function get_spell(source, name) {
    let data = await get_data(`https://sauros.xyz/projects/5e/data/spells/spells-${source.toLowerCase()}.json`);
    if (data == null) {
        return;
    }

    let spell_result = data["spell"].filter((spell) => spell.name == name);

    if (spell_result.length == 1) {
        const SPELL = spell_result[0];

        let result = new Spell({
            name: SPELL.name,
            description: SPELL.entries,
            level: SPELL.level,
        });

        if (SPELL.time[0].unit == "action") {
            result.casting_time = new ActivationTime(
                `${(SPELL.time[0].number > 1 ? SPELL.time[0].number + " " : "")}Action`,
            );
        } else if (SPELL.time[0].unit == "bonus") {
            result.casting_time = new ActivationTime(
                `${(SPELL.time[0].number > 1 ? SPELL.time[0].number + " " : "")}Bonus action`,
            );
        } else if (SPELL.time[0].unit == "reaction") {
            result.casting_time = new ActivationTime(
                `${(SPELL.time[0].number > 1 ? SPELL.time[0].number + " " : "")}Reaction`,
                SPELL.time[0].condition
            );
        }

        result.components = new SpellComponents(
            has_verbal = SPELL.components.v,
            has_somatic = SPELL.components.s,
            has_material = SPELL.components.m != null,
            material = SPELL.components.m != null ? (SPELL.components.m.text ?? SPELL.components.m) : null,
        );

        if (SPELL.duration[0].type == "timed") {
            if (SPELL.duration[0].duration.type == "minute") {
                result.duration = new Duration(
                    `${SPELL.duration[0].duration.amount} minute${(SPELL.duration[0].duration.amount > 1 ? "s" : "")}`,
                    SPELL.duration[0].concentration,
                );
            } else if (SPELL.duration[0].duration.type == "round") {
                result.duration = new Duration(
                    `${SPELL.duration[0].duration.amount} round${(SPELL.duration[0].duration.amount > 1 ? "s" : "")}`,
                    SPELL.duration[0].concentration,
                );
            }
        } else if (SPELL.duration[0].type == "instant") {
            result.duration = new Duration(
                `Instantaneous`,
                SPELL.duration[0].concentration,
            );
        }

        result.effect = new SpellEffect();
        let matches = result.description.toString().match(/\{@(damage|dice) [0-9]{1,4}d[0-9]{1,2}[0-9 +\-]{0,9}\}/g);

        if (matches != null) {
            for (const damage_roll of result.description.toString().match(/\{@(damage|dice) [0-9]{1,4}d[0-9]{1,2}[0-9 +\-]{0,9}\}/g)) {
                let damage = new Damage();
                if (SPELL.damageInflict != null) {
                    damage.type = SPELL.damageInflict[0].charAt(0).toUpperCase() + SPELL.damageInflict[0].slice(1);
                } else {
                    damage.type = "";
                }

                let roll = damage_roll.replace("{@damage ", "").replace("{@dice ", "").replace("}", "");
                damage.roll.num = roll.split('d')[0];
                damage.roll.dice = `d${roll.split('d')[1]}`;

                result.effect.damage.push(damage);
            }

            if (SPELL.spellAttack != null) {
                result.effect.attack = true;
            }
        }

        if (SPELL.range.type == "point") {
            if (SPELL.range.distance.type == "self") {
                result.range = "Self";
            } else if (SPELL.range.distance.type == "feet") {
                result.range = `${SPELL.range.distance.amount} ft.`;
            }
        } else if (SPELL.range.type == "radius") {
            result.range = `Self/${SPELL.range.distance.amount} ft.`;
        }

        if (SPELL.savingThrow != null) {
            result.effect.save = new Save();
            result.effect.save.stat = abilityFromString(SPELL.savingThrow[0]);
        }

        result.source = SPELL.source + " pg. " + SPELL.page;

        return result;
    } else {
        return null;
    }
}

function render_description(str, delimeter = "\n") {
    let result = "";

    if (typeof str == "string") {
        result = str;
    } else if (str.constructor.name == "Array") {
        for (let i = 0; i < str.length; i++) {
            result += str[i];
            if ((i + 1) < str.length)
                result += delimeter;
        }
    } else if ("type" in str && str["type"] == "list") {
        result += "<ul>";
        for (let i = 0; i < str["items"].length; i++) {
            result += "<li>" + str["items"][i] + "</li>";
            if ((i + 1) < str["items"].length)
                result += delimeter;
        }
        result += "</ul>";
    }

    return result;
}
