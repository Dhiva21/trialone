import {
  select,
  xml,
  json,
  scaleOrdinal,
  map
} from 'd3';

import { loadAndProcData } from './loadAndProcData';
import { mapPlot } from './mapPlot';
import { piePlot } from './piePlot';
import { linePlot } from './linePlot';
import { controlPanel } from './controlPanel';

//inizializzazione e valori di default
const valDefault = {	
  							Luogo: "Tutta la regione",
              	Grado: "Tutti i gradi",
              	Anno: 2021
					  };

let choose = {...valDefault};
let data;

//funzioni di servizio
const name_format = (name) => {
		return (name.replaceAll("_x27_","'").replaceAll("_"," "))
};

const onPlaceClicked = d => {
  choose.Luogo = d;
  render();
};
const onDegreeClicked = d => {
  choose.Grado = d;
  render();
};
const onYearClicked = d => {
  choose.Anno = d;
  render();
};

let selectedYear = valDefault.Anno;
const setSelectedYear = year => {
  selectedYear = year;
  render();
};

const filterFun = function(d,luogo,grado,anno){
  if 	(d.Luogo==luogo && d.Grado==grado && d.Anno==anno) return true
  else return false
}

const collectData = function(loadedData){
  data = loadedData;
  render();
}

//caricamento unico della mappa
xml("mappa.svg").then(d => {
    select("body").node()
      .append(d.documentElement);
  	render();
});

//funzione di render
const render = () => {
  
  //mappa colori
	const colorScaler = scaleOrdinal();
	colorScaler
		.domain(map(data,(d=>d.Grado)).keys()) 
  	.range(["#c1b2abff","#92374dff", "#8c5383ff", "#4a5899ff", "#559cadff"]);
  	
  //pannello di controllo laterale
  select("body").call(controlPanel, {
    valDefault: valDefault,
    colorScaler: colorScaler,
    onPlaceClicked: onPlaceClicked,
    onDegreeClicked: onDegreeClicked,
    onYearClicked: onYearClicked,
    filterFun: filterFun,
    choose: choose,
    data: data
  });
  
  //mappa
  select("body").call(mapPlot, {
    valDefault: valDefault,
    name_format: name_format,
    colorScaler: colorScaler,
    onPlaceClicked: onPlaceClicked,
    filterFun: filterFun,
    choose: choose,
    data: data
  });
  
  //torte
  select("body").call(piePlot, {
    valDefault: valDefault,
    name_format: name_format,
    colorScaler: colorScaler,
    onDegreeClicked: onDegreeClicked,
    filterFun: filterFun,
    choose: choose,
    data: data
  });
  
  //andamento
  select("body").call(linePlot, {
    valDefault: valDefault,
    name_format: name_format,
    colorScaler: colorScaler,
    onYearClicked: onYearClicked,
    filterFun: filterFun,
    choose: choose,
    loadedData: data
  });

};

//caricamento e processamento dati
json('dataset.json')
  .then(d => {
      data = loadAndProcData({
      valDefault:valDefault,
      name_format: name_format,
      filterFun: filterFun,
      loadedData: d
    });
  render();
});