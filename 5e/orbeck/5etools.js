
async function init() {
    let spells = await get_data("https://5e.tools/data/spells/index.json");
    console.log(spells);
}

init();
