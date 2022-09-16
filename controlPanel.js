import {
  select,
  map,
} from 'd3';

import { dropdownMenu } from './dropdownMenu';

function numberWithPoint(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export const controlPanel = (selection, props) => {
 	const {
    valDefault,
    colorScaler,
    onPlaceClicked,
    onDegreeClicked,
    onYearClicked,
    filterFun,
    choose,
    data
  } = props;
  
  //disegno pannello di controllo
  const ctrlP = selection.selectAll("#ctrl-panel")
    .data([null]);
  const ctrlEnter = ctrlP					
    	.enter().append("div")		
    		.attr("id", "ctrl-panel")
  	ctrlEnter
    	.merge(ctrlP)

  //disegno head del pannello
  const headP = ctrlP.select("#head-panel")
  const headEnter = ctrlEnter
  	.append("div")
  		.attr("id", "head-panel");
  	headP
    	.merge(headEnter)
  			.style("color", colorScaler(choose.Grado))
  			.text("Scuola Basilicata");
  
  //disegno body del pannello
  const bodyP = ctrlP.select("#body-panel")
  const bodyEnter = ctrlEnter
  	.append("div")
  		.attr("id", "body-panel");
  	bodyP
    	.merge(bodyEnter)
      .call(dropdownMenu, {
      	id:"place",
        options: map(data,d=>d.Luogo).keys(),
        onOptionClicked: onPlaceClicked,
        selectedOption: choose.Luogo,
      	firstEl:valDefault.Luogo,
      	asc: true
      })
  		.call(dropdownMenu, {
      	id:"degree",
        options: map(data,(d=>d.Grado)).keys(),
        onOptionClicked: onDegreeClicked,
        selectedOption: choose.Grado,
      	firstEl:valDefault.Grado,
      	asc: true
      })
  		.call(dropdownMenu, {
      	id:"year",
        options: map(data,(d=>d.Anno)).keys(),
        onOptionClicked: onYearClicked,
        selectedOption: choose.Anno,
      	fisrtEl: null,
      	asc: false
      });
  
  //disegno label informative
  const labelP = bodyP.select(".wrap-label");
  const labelEnter = bodyEnter
  	.append("div")
  		.attr("class", "wrap-label");
  	labelP
    	.merge(bodyEnter);
  
  let dataSelected = data.filter(d=>filterFun(d,choose.Luogo,choose.Grado,choose.Anno));
  let Pop = dataSelected.map(d=>d.Popolazione);
  let Cls = dataSelected.map(d=>d.Classi);
  let Avg = Math.round(Pop/Cls);
      
  const l0 = labelP.select("#label0");
  const l0Enter = labelEnter
  	.append("label")
  		.attr("id", "label0")
  	l0
    	.merge(l0Enter)
  			.text("Alunni registrati: ")
  			.append("span")
  			.text(numberWithPoint(Pop));
  
  const l1 = labelP.select("#label1");
  const l1Enter = labelEnter
  	.append("label")
  		.attr("id", "label1")
  	l1
    	.merge(l1Enter)
  			.text("Classi registrate: ")
  			.append("span")
  			.text(numberWithPoint(Cls));
  
  const l2 = labelP.select("#label2");
  const l2Enter = labelEnter
  	.append("label")
  		.attr("id", "label2")
  	l2
    	.merge(l2Enter)
  			.text("Alunni per classe: ")
  			.append("span")
  			.text(numberWithPoint(Avg ? Avg : 0));
  
}