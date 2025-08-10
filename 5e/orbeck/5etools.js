
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
    let data = await get_data(`https://5e.tools/data/spells/spells-${source.toLowerCase()}.json`);
    if (data == null) {
        return;
    }

    let spell_result = data["spell"].filter((spell) => spell.name == name);

    console.log(spell_result);
    if (spell_result.length > 1) {
        const SPELL = spell_result[0];
    } else {
        console.log("got multiple spells!");
    }
}
