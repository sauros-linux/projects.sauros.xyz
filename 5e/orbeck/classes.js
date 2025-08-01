
const ABILITY = Object.freeze({
    STR: 0,
    DEX: 1,
    CON: 2,
    INT: 3,
    WIS: 4,
    CHA: 5,
});
function abilityToString(ability, short = false) {
    switch (ability) {
        case ABILITY.STR:
            return short ? "STR" : "Strength";
        case ABILITY.DEX:
            return short ? "DEX" : "Strength";
        case ABILITY.CON:
            return short ? "CON" : "Strength";
        case ABILITY.INT:
            return short ? "INT" : "Strength";
        case ABILITY.WIS:
            return short ? "WIS" : "Strength";
        case ABILITY.CHA:
            return short ? "CHA" : "Strength";
    }
}
const DAMAGE_TYPE = Object.freeze({
    ACID: "Acid",
    BLUDGEONING: "Bludgeoning",
    COLD: "Cold",
    FIRE: "Fire",
    FORCE: "Force",
    LIGHTNING: "Lightning",
    NECROTIC: "Necrotic",
    PIERCING: "Piercing",
    POISON: "Poison",
    PSYCHIC: "Psychic",
    RADIANT: "Radiant",
    SLASHING: "Slashing",
    THUNDER: "Thunder",
});
const DICE = Object.freeze({
    D4: "d4",
    D6: "d6",
    D8: "d8",
    D10: "d10",
    D12: "d12",
    D20: "d20",
    D100: "d100",
})
const SCHOOL = Object.freeze({
    ABJURATION: "Abjuration",
    CONJURATION: "Conjuration",
    DIVINATION: "Divination",
    ENCHANTMENT: "Enchantment",
    EVOCATION: "Evocation",
    ILLUSION: "Illusion",
    NECROMANCY: "Necromancy",
    TRANSMUTATION: "Transmutation",
});
const SIZE = Object.freeze({
    TINY: "Tiny",
    SMALL: "Small",
    MEDIUM: "Medium",
    LARGE: "Large",
    HUGE: "Huge",
    GARGANTUAN: "Gargantuan",
});

class ActivationTime {
    time = "Action";
    condition = "";

    constructor(time = "Action", condition = "") {
        this.time = time;
        this.condition = condition;
    }

    toShortString() {
        let short_string = "";

        switch (this.time) {
            case "Action":
                short_string = "1A";
                break;
            case "Bonus action":
                short_string = "1BA";
                break;
            case "Reaction":
                short_string = "1R";
                break;
            case "1 minute":
                short_string = "1 min.";
                break;
            case "10 minutes":
                short_string = "10 min.";
                break;
            case "1 hour":
                short_string = "1 hr.";
                break;
            case "8 hours":
                short_string = "8 hr.";
                break;
            case "12 hours":
                short_string = "12 hr.";
                break;
            case "24 hours":
                short_string = "24 hr.";
                break;
        }

        if (this.condition != "")
            return short_string + "*";
        else
            return short_string;
    }

    toString() {
        if (this.condition != "")
            return this.time + ", " + this.condition;
        else
            return this.time;
    }
}

class Character {
    name = "";
    ability_scores = [0, 0, 0, 0, 0, 0];
    level = 0;
    spells = [];

    getProficiencyBonus() {
        return Math.round((this.level + 1) / 4) + 1;
    }
}

function close_description() {
    document.getElementById("description").innerHTML = "";
    document.getElementById("description").style.width = "0";
    document.getElementById("description").style.minWidth = "0";
}

function copy_title_to_clipboard(e) {
    navigator.clipboard.writeText(`${e.target.innerText}: ${e.target.getAttribute("title")}`);
}

class Damage {
    roll = new Roll();
    type = DAMAGE_TYPE.BLUDGEONING;

    constructor() {
        this.roll = Object.assign(new Roll(), this.roll);
    }

    toString() {
        return this.roll.toString() + " " + this.type;
    }
}

class Description {
    text = "";

    constructor(text = "") {
        this.text = text;
    }

    toHTML() {
        if (Array.isArray(this.text)) {
            let result = "<p>";
            for (let i = 0; i < this.text.length; i++) {
                result += this.text[i] + "</p>";
            }
            return result;
        }
        else
            return this.text;
    }

    toString() {
        if (Array.isArray(this.text)) {
            let result = "";
            for (let i = 0; i < this.text.length; i++) {
                result += this.text[i] + "\n";
            }
            return result;
        }
        else
            return this.text;
    }
}

class Duration {
    concentration = false;
    time = "";

    constructor(time, concentration = false) {
        this.concentration = concentration;
        this.time = time;
    }

    toString() {
        if (this.concentration)
            return "Concentration, up to " + this.time;
        else
            return this.time;
    }
}

class Feature {
    name = "";
    description = "";
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

function open_description(html) {
    //document.getElementById("container").style.backgroundColor = "#000000";

    document.getElementById("description").innerHTML = html;
    document.getElementById("description").style.width = "30%";
    document.getElementById("description").style.minWidth = "500px";

    document.getElementById("description").innerHTML += "<button id=\"close_button\" onclick=\"close_description()\">Close</button>"
}

class Roll {
    dice = DICE.D20;
    num = 1;
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
        if (this.dice == DICE.D20)
            return `${this.getModifierString()}${extra_roll_strings}`;
        else
            return `${this.num}${this.dice}${this.getModifierString()}${extra_roll_strings}`;
    }
}

class Save {
    effect_on_pass = new Description();
    effect_on_fail = new Description();
    dc = 10;
    stat = ABILITY.STR;

    toString() {
        return `DC ${this.dc} ${abilityToString(this.stat, true)}`;
    }
}

class Species {
    name = "";
    creature_type = "";
    description = "";
    id = "";
    size = SIZE.MEDIUM;
    source = "";
    speed = 30;
    features = [];
}

class Spell {
    name = "";
    casting_stat = null;
    casting_time = new ActivationTime();
    components = new SpellComponents();
    description = new Description();
    duration = new Duration();
    effect = new SpellEffect();
    level = 0;
    proficiency_bonus = 2;
    school = SCHOOL.ABJURATION;
    source = "";

    constructor(json) {
        Object.assign(this, json);

        this.casting_time = Object.assign(new ActivationTime(), this.casting_time);
        this.components = Object.assign(new SpellComponents(), this.components);
        this.description = new Description(this.description);
        this.duration = Object.assign(new Duration(), this.duration);

        if (this.effect == null) {
            this.effect = new SpellEffect();
        } else {
            this.effect = Object.assign(new SpellEffect(), this.effect);
            this.effect.damage = Object.assign(new Damage(), this.effect.damage);
            this.effect.damage.roll = Object.assign(new Roll(), this.effect.damage.roll);

            if (this.effect.save != null) {
                this.effect.save = Object.assign(new Save(), this.effect.save);
                this.effect.save.dc = this.getCastingSave();
                this.effect.save.effect_on_fail = new Description(this.effect.save.effect_on_fail);
                this.effect.save.effect_on_pass = new Description(this.effect.save.effect_on_pass);
            }
        }
    }

    getCastingModifier() {
        return Math.floor((this.casting_stat - 10) / 2);
    }

    getCastingSave() {
        return 8 + this.getCastingModifier() + this.proficiency_bonus;
    }

    toHTML() {
        return `<table>
    <tr><th colspan='4'>${this.name}</th></tr>
    <tr>
        <td>Casting Time</td>
        <td>Range</td>
        <td>Components</td>
        <td>Duration</td>
    </tr>
    <tr>
        <td>${this.casting_time}</td>
        <td>${this.range}</td>
        <td>${this.components}</td>
        <td>${this.duration}</td>
    </tr>
    <tr>
        <td colspan='4' style='text-align: left;'>${this.description.toHTML()}</td>
    </tr>
    <tr><td colspan='4'><button label='${this.name}' class='rollable'>Cast</button></td></tr>
</table>`;
    }

    toShortHTML() {
        let modifier = this.getCastingModifier() + this.proficiency_bonus;
        let spell_attack_to_hit_button = this.effect.attack ? `<button label="${this.name}" class="rollable">${(modifier >= 0 ? "+" : "-") + modifier}</button>` : "";
        let spell_attack_save = this.effect.isSave() ? `<button title="${this.effect.save.effect_on_fail.toString()}" onclick=copy_title_to_clipboard(event)>${this.effect.save.toString()}</button>` : "";
        let spell_attack_damage_button = this.effect.isAttack() ? `<button label="${this.name}" class="rollable">${this.effect.damage.toString()}</button>` : "";
        return `<tr>
        <td><button label="${this.name}">Cast</button></td>
        <th onclick="open_description(\`${this.toHTML()}\`)">${this.name}</th>
        <td>${this.casting_time.toShortString()}</td>
        <td>${this.range}</td>
        <td>${spell_attack_to_hit_button}${spell_attack_save}</td>
        <td>${spell_attack_damage_button}</td>
    </tr>`;
    }
}

class SpellComponents {
    has_verbal = false;
    has_somatic = false;
    has_material = false;
    material = "";

    toString() {
        let verbal_string = this.has_verbal ? ("V" + ((this.has_somatic || this.has_material) ? ", " : "")) : "";
        let somatic_string = this.has_somatic ? ("S" + (this.has_material ? ", " : "")) : "";
        let material_string = this.has_material ? `M (${this.material})` : "";
        return verbal_string + somatic_string + material_string;
    }
}

class SpellEffect {
    attack = false;
    damage = null;
    description = new Description();
    save = null;

    isAttack() {
        return this.damage != null || this.attack;
    }

    isSave() {
        return this.save != null;
    }
}
