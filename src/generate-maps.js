const Handlebars = require('handlebars');
const fs = require('fs');
const pnfs = require("pn/fs");
const sharp = require("sharp");

const MAP_TEMPLATE = 'maps/templates/_map-world-template.svg';
const DEST_DIR_SVG = 'maps/';
const DEST_DIR_PNG = '../media/maps/';

const mapdata = require("./map-data.json");
 
var source = fs.readFileSync(MAP_TEMPLATE, 'utf8');

const COLOR_GREY = '#d2d2d2';
const COLOR_DARK_GREY = '#706f6f';
const COLOR_PINK = '#e22781';
const COLOR_YELLOW = '#fbc90d';

// prepend with id (e.g. '#ai .landxx { ... }')
const CSS_CIRCLE_LAND = ' .landxx { fill: #e22781; stroke-width: 1px; stroke: #e22781; }';

// prepend with id (e.g. '#ai_ { ... }')
const CSS_CIRCLE_CIRC = '_ { opacity: 0.5; stroke: #e22781; fill: transparent; }';

var default_context = {
  viewBox: '0 0 2560 1314',
  width: 1260,
  height: 1000,
  overrideCss: '',
  region_fills: {
      'africa': COLOR_GREY, 
      'asia': COLOR_GREY, 
      'east_asia': COLOR_GREY, 
      'west_asia': COLOR_GREY, 
      'russia': COLOR_GREY, 
      'europe': COLOR_GREY, 
      'north_america': COLOR_GREY, 
      'central_america': COLOR_GREY, 
      'south_america': COLOR_GREY, 
      'oceania': COLOR_GREY, 
  }
};

const regionMaps = new Map();
const REGION_CSV = DEST_DIR_PNG + 'regions.csv'

async function renderMap (country, regionOnly = false) {
    var dest_svg_filename = DEST_DIR_SVG + 'world-' + country.name + '-map.svg';
    var dest_png_filename = DEST_DIR_PNG + 'world-' + country.name + '-map.png';

    // If the png already exists, skip
    if (!regionOnly && fs.existsSync(dest_png_filename)) {
        return;
    }

    // Doing it this way to get fresh context obj each pass.
    var context = JSON.parse(JSON.stringify(default_context));

    // Set the viewBox from the defined region if exists
    if (country.vbregion) {
        context.viewBox = mapdata.regions[country.vbregion].viewBox;
        if (mapdata.regions[country.vbregion].width) {
            context.width = mapdata.regions[country.vbregion].width;
        }
        if (mapdata.regions[country.vbregion].height) {
            context.height = mapdata.regions[country.vbregion].height;
        }
    }

    if (country.in) {
        context.region_fills[country.in] = COLOR_DARK_GREY;
    }

    if (country.in && !country.vbregion) {
        context.viewBox = mapdata.regions[country.in].viewBox;
        if (mapdata.regions[country.in].width) {
            context.width = mapdata.regions[country.in].width;
        }
        if (mapdata.regions[country.in].height) {
            context.height = mapdata.regions[country.in].height;
        }
    }

    // Set viewBox dims if exist
    if (country.viewBox) {
        context.viewBox = country.viewBox;
    }

    // Generate region maps without highlighed country
    if (regionOnly){
        // check if region has already been saved
        if (!regionMaps.has(context.viewBox)){
            regionNum = regionMaps.size + 1
            const dest_reg_svg_filename = DEST_DIR_SVG + 'reg-' + regionNum + '.svg';
            const dest_reg_png_filename = DEST_DIR_PNG + 'reg-' +  regionNum + '.png';
            regionMaps.set(context.viewBox, dest_reg_png_filename.split("/").pop())
            if(!fs.existsSync(dest_reg_png_filename)){
                result = render_png(context, dest_reg_svg_filename, dest_reg_png_filename)
            } else {
                result = null
            }

        } 
        // Write csv with region for each country
        try {
            img_tag = `"<img src=""${regionMaps.get(context.viewBox)}"" />"`
            line = country.name.replace(',', '') + ',' + img_tag + '\n'
            fs.appendFileSync(REGION_CSV, line);
            //console.log(line)
            // file written successfully
        } catch (err) {
            console.error(err);
        }
        return result
        // Returns without generating the country highlight
    }
    

    // Highlight any targeted class names (codes)
    if (country.codes) {
        for (var code of country.codes) {
            context.overrideCss += "." + code + "{ fill:" + COLOR_PINK + ";}\n"; 
        }
    }

    // Highlight single targeted country class name (code)
    if (country.code) {
        context.overrideCss += "." + country.code + "{ fill:" + COLOR_PINK + ";}\n"; 
    }

    // If we need to circle the country, do so
    if (country.circle) {
        var css = "#" + country.circle + CSS_CIRCLE_LAND
            + '#' + country.circle + CSS_CIRCLE_CIRC;
        context.overrideCss += css;
    }

    return render_png(context, dest_svg_filename, dest_png_filename)

}

async function render_png(context, dest_svg_filename, dest_png_filename){
    var template = Handlebars.compile(source);

    // Generate the SVG with context updates
    var generated = template(context);

    fs.writeFileSync(dest_svg_filename, generated);

    var input = fs.readFileSync(dest_svg_filename);

    return sharp(input).png().toBuffer().then(function (output) {
        fs.writeFileSync(dest_png_filename, output);
    });
}

// Render region pngs without country highlighs.
async function renderRegions(){
    console.log("Redering regions")
    fs.unlink(REGION_CSV, (err) => {
        if (err) throw err;
    });
    var count = 0
    for (var country of mapdata.countries) {
        await renderMap(country, true);  // True = region only
        count++
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`Progress: ${Math.floor(count / mapdata.countries.length * 100)}%`)
    }
    console.log()

}
const CONCURRENCY = 8;
async function generateAllCountries() {

    await renderRegions();
    console.log("Rendering maps")

    var queue = mapdata.countries.slice();
    var workers = [];

    for (var w = 0; w < CONCURRENCY; w++) {
        workers.push((async function worker() {
            var country;
            while ((country = queue.shift())) {
                await renderMap(country);
                count_done += 1
                const progressPercentage = Math.floor(count_done / mapdata.countries.length * 100) ;
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(`Progress: ${progressPercentage}% ${count_done}/${mapdata.countries.length}`);

            }
        })());
    }

    await Promise.all(workers);
}

// First get a count of how many we need to generate
var count = 0;
var count_done = 0
for (var country of mapdata.countries) {
    var dest_png_filename = DEST_DIR_PNG + 'world-' + country.name + '-map.png';
    if (!fs.existsSync(dest_png_filename)) {
        count++;
    }
}
console.log(count + " maps to generate.");

generateAllCountries()
