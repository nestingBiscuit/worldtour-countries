const csv = require("csv/sync");
const wiki = require('wikipedia');
const fs = require('fs');
const { parseInfobox } = require('./parseInfobox');
const { match } = require("assert");
const path = require('path');

const COUNTRY_DATA = 'data/country_data/'

async function getCountryInfo(country, lang=undefined){
    try {
        if(lang){
            wiki.setLang(lang);
        }
        const infoboxOptions = {
            prop: 'revisions',
            rvprop: 'content',
            rvsection: 0
        }
        console.log("Fetching " + country + " info")
        const fullInfo = await wiki.rawInfo(country, infoboxOptions, true);
        const infobox = parseInfobox(fullInfo)
        return infobox
	} catch (error) {
        console.error("ERROR: " + country)
		console.log(error);
		//=> Typeof wikiError
	}
}

function cleanInt(str){
    if(typeof(str) === 'string'){
        var cleanStr = str.replaceAll(/[,.]/g, '').trim()
        return cleanStr
    } else if (typeof(str) === 'number'){
        return str
    }
    throw new Error("Parameter is not a string or a number! -> " + str)
}

// Returns the newest popoulation data from wikipedia
function getPopulation(countryInfobox, lang=null){
    //console.log("-----" + countryInfobox.sortName + "-----")
    var base = {
        year: -1,
        population: 0,
        type: 'census'
    }
    var census = {...base}
    var est = {...base}

    //console.log(infobox)
    if('populationCensus' in countryInfobox){
        census.population = cleanInt(countryInfobox.populationCensus)
        census.year = cleanInt(countryInfobox.populationCensusYear).match(/(?:19|20)\d\d/)[0]

        //console.log(`cencus: ${JSON.stringify(census)}`)
    }

    if('populationEstimate' in countryInfobox){
        
        est = {
            year: cleanInt(countryInfobox.populationEstimateYear).match(/(?:19|20)\d\d/)[0],
            population: cleanInt(countryInfobox.populationEstimate),
            type: 'estimate'
        }

        //console.log(`est: ${JSON.stringify(est)}`)
    }

    if (est.year > census.year){
        return est
    } else {
        return census
    }
}

function readCountriesCSV(){
    const content = fs.readFileSync("data/countries.anki.csv")
    countries = csv.parse(content, {delimiter: ";"})

    return countries
}

/**
 * Source: https://www.xjavascript.com/blog/javascript-shorten-large-numbers-force-decimal-places-and-choose-to-represent-1000-s-as-001-millions/
 */
function shortenNumber(num, local=undefined) {
  // Handle edge cases: 0, negative numbers, or non-numbers
  if (isNaN(num)) return "0";
  const isNegative = num < 0;
  const absNum = Math.abs(num);
    //console.log(num.toLocaleString(local))
  // Define suffixes and their thresholds
  const suffixes = [
    { threshold: 1e9, suffix: " Billion" }, // Billions (1,000,000,000)
    { threshold: 1e6, suffix: " Million" }, // Millions (1,000,000)
    { threshold: 1, suffix: "" }     // No suffix (for numbers <1,000,000)
  ];
 
  // Find the appropriate suffix
  const { threshold, suffix } = suffixes.find(s => absNum >= s.threshold);
 
  // Scale the number and round to specified decimals
  var scaled = absNum / threshold;
  var decimals = 2
  if (!suffix && scaled >= 1000){
    // Zero out the last 3 digits on number between 1000 - 1,000,000
     scaled = Math.round(scaled / 1000) * 1000
  } else if (suffix){

    if(scaled >= 100.0){
        decimals = 0
    } else if (scaled >= 10.0){
        decimals = 1
    }
  } 
    var rounded = scaled.toLocaleString(local, { // Rounds to `decimals` places
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: decimals,
                                            //roundingMode: 'floor'
                                            })

 
  // Combine sign, rounded number, and suffix
  return `${isNegative ? "-" : ""}${rounded.toLocaleString(local)}${suffix}`;
}

async function fetchAllCountryData(force=false){
    countries = readCountriesCSV()
    names = countries.map((c) => c[0].split(',').reverse().join(' ').trim())
    for(var i = 0; i < names.length; i++){
        name = names[i]
        file = `${COUNTRY_DATA}${name}.json`
        // Skip if 
        if (!force && fs.existsSync(file)) { continue; }
        
        // Should return the correct page for Georia and Ireland
        name = name + " (country)"
        const info = await getCountryInfo(name)
        info['sortName'] = countries[i][0]

        fs.writeFileSync(file, JSON.stringify(info, null, 2) , 'utf-8');

    }
}

function loadAllCountryData(){
    countries = readCountriesCSV()
    names = countries.map((c) => c[0].split(',').reverse().join(' ').trim())
    return names.map( name => {
        file = `${COUNTRY_DATA}${name}.json`
        s = fs.readFileSync(file)
        return JSON.parse(s)
    })

    return result
}
async function downloadFlag(countryInfo, outDir='./newFlags'){
    const filename = countryInfo.imageFlag
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`
    const outFileName = `world-${countryInfo.sortName.toLowerCase().replaceAll(/\s/g, '_')}-flag.svg`
    const outPath = path.join(outDir, outFileName);

    if(fs.existsSync(outPath)){
        //console.log(outFileName + " already downloaded")
        return outFileName
    }

    if (!filename){
        console.error(countryInfo.sortName + " is missing a flag")
        return undefined
    }
    console.log("Downloading " + outFileName)
    const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'InfoboxParserBot/1.0' },
     });

      if (!res.ok) {
    throw new Error(`Failed to fetch "${filename}": HTTP ${res.status}`);
  }
    
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, buffer);
    return outFileName;


}

async function downloadAllFlags(countries_data, outDir='./newFlags') {
    const FLAG_CSV = outDir + "/../flags.csv"
    fs.unlink(FLAG_CSV, (err) => {
        if (err && err.code !== "ENOENT") throw err;
    });
    for(var i = 0; i < countries_data.length; i++){
        const country = countries_data[i]
        file = await downloadFlag(country, outDir)
        try {
            const img_tag = `"<img src=""${file}"" />"`

            line = country.sortName + ';' + img_tag + '\n'
            fs.appendFileSync(FLAG_CSV, line);

            // file written successfully
        } catch (err) {
            throw err
            console.error(err);
        }
    }
}

function writePopulation(data){

    const header = ['name', 'commonName', 'longName','population', 'populaiton formatted', 'population year']
    var pop = data.map(c =>{
        p = getPopulation(c)
        var popFormatted = p.population
        numRegex = /\d+/g

        for (const m of popFormatted.matchAll(/\d+/g)){
            popFormatted = popFormatted.replace(m[0], shortenNumber(m[0]))
        }
        let commonName = c.commonName ?? c.name
        let longName = (c.conventionalLongName !== commonName) ? c.conventionalLongName : c.linkingName
        return [c.sortName, commonName , longName ,p.population.match(/\d+/)[0], `"${popFormatted}"`,  `(${p.year} ${p.type})`]
    })

    pop.splice(0, 0, header);
    fs.writeFileSync('./data/population.csv' , csv.stringify(pop))
}

function wirteStatus(data){
    const header = ['name', 'infotype', 'type', "status", "subdivisionName"]
    var status = data.map(c =>{
        return [c.sortName, c.infoboxType ?? "", c.type ?? "", c.status ?? "", c.subdivisionName ?? c.subdivisionName1, c.subdivisionType ?? c.subdivisionType1]
    })

    status.splice(0, 0, header);
    fs.writeFileSync('./data/status.csv' , csv.stringify(status))
}

async function main(){
    await fetchAllCountryData()
    data = loadAllCountryData()

    keys = data.map(d => {
        return Object.keys(d).filter(key => key.search(/name/i) !== -1)
    })
    console.log(new Set(keys.flat()))

    writePopulation(data)
    wirteStatus(data)

    downloadAllFlags(data, "media/flags/")
}

main()