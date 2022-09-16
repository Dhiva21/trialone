import {
  select,
  map,
  svg,
  scaleOrdinal,
  extent,
  pie,
  arc,
  entries,
  nest
} from 'd3';

export const piePlot = (selection, props) => {
  const {
    valDefault,
    name_format,
    colorScaler,
    onDegreeClicked,
    filterFun,
    choose,
    data
  } = props;

  //genera percentuali
  var dataTmp = data.filter(d=>d.Grado!=valDefault.Grado)
  									.filter(d=>filterFun(d,choose.Luogo,d.Grado,choose.Anno));
	var tmpP = nest()
    .key(d =>d.Grado)
    .rollup(d=> d[0].Popolazione)
    .entries(dataTmp);
  var percentsP = {};
  tmpP.forEach(d=>percentsP[d.key] = d.value);
  
  var tmpC = nest()
    .key(d =>d.Grado)
    .rollup(d=> d[0].Classi)
    .entries(dataTmp);
  var percentsC = {};
  tmpC.forEach(d=>percentsC[d.key] = d.value);
 
  /*
  let dataTmp = data.filter(d=>d.Grado!=valDefault.Grado);
  (map(dataTmp,(d=>d.Grado)).keys()).forEach(function(g) {
  	 percentsP[g] = dataTmp.filter(d=>filterFun(d,choose.Luogo,g,choose.Anno))
    				 											.map(d=>d.Popolazione)
             											.reduce((a,b)=>a+b,0);
     percentsC[g] = dataTmp.filter(d=>filterFun(d,choose.Luogo,g,choose.Anno))
    				 											.map(d=>d.Classi)
             											.reduce((a,b)=>a+b,0);
  }); */                            
  
  //disegna container
  const contP = selection.selectAll("#torta")
    .data([null]);
  const contEnter = contP					
    	.enter().append("svg")		
    		.attr("id", "torta")
  	contEnter
    	.merge(contP)
  	
	//disegna primo chart
  
  // set the dimensions and margins of the graph
  var width1 = 200
  var height1 = 200
  var margin1 = 30

  // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
  var radius1 = Math.min(width1, height1) / 2 - margin1

  //Compute the position of each group on the pie:
  var donut1 = pie()
    .value(function(d) {return d.value; })
  var data_ready = donut1(entries(percentsC))

  // append the svg object to the div called 'my_dataviz'
  const chart1 = contP.select("#donut1");
    const chart1Enter = contEnter
      .append("g")
        .attr("id", "donut1")
        .attr("transform", "translate(" + 100 + "," + 140  + ")");
    const base1 = chart1Enter
      .merge(chart1)

  // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
   const parts1 = base1.selectAll('path').data(data_ready);
    parts1.enter().append('path')
      .merge(parts1)
      .attr('d', arc()
        .innerRadius(85)         // This is the size of the donut hole
        .outerRadius(radius1)
      )
      .attr('fill', d=>colorScaler(d.data.key)) 
      .attr("stroke", "#1B1725")
      .style("stroke-width", "5px")
      .style("cursor","pointer")
      .style("opacity", d=>(d.data.key == choose.Grado) ? 1 : 0.3)
      .on("click", function (d) {
          onDegreeClicked(d.data.key);
       })
      .append('title')
        .text(function(d){return d.data.key});

    const centerText1 = base1.selectAll('#pieLabelC').data([null]);
    centerText1.enter().append("text")
      .merge(centerText1)
        .attr("id", "pieLabelC")
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("fill", colorScaler(choose.Grado))
        .attr("font-weight", "700")
                .style("font-size",  choose.Grado == valDefault.Grado ? "2rem" : "3rem")
        .style("cursor","default")
        .text(	
                choose.Grado == valDefault.Grado ?
                  "Classi"
                :
                  Math.round(percentsC[choose.Grado]/Object.values(percentsC).reduce((a,b)=>a+b,0)*100)+"%"
             )
        .append('title')
          .text("Classi");
  
	//disegna secondo chart
  
  // set the dimensions and margins of the graph
  var width2 = 280
  var height2 = 280
  var margin2 = 20

  // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
  var radius2 = Math.min(width2, height2) / 2 - margin2

  // Compute the position of each group on the pie:
  var donut2 = pie()
    .value(function(d) {return d.value; })
  var data_ready = donut2(entries(percentsP));

  // append the svg object to the div called 'my_dataviz'
  const chart2 = contP.selectAll("#donut2");
    const chart2Enter = contEnter
      .append("g")
        .attr("id", "donut2")
        .attr("transform", "translate(" + 320 + "," + 260  + ")");
    const base2 = chart2Enter
      .merge(chart2)

   // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
   const parts2 = base2.selectAll('path').data(data_ready);
    parts2.enter().append('path')
      .merge(parts2)
      .attr('d', arc()
        .innerRadius(135)         // This is the size of the donut hole
        .outerRadius(radius2)
      )
      .attr('fill', d=>colorScaler(d.data.key)) 
      .attr("stroke", "#1B1725")
      .style("stroke-width", "5px")
      .style("cursor","pointer")
      .style("opacity", d=>(d.data.key == choose.Grado) ? 1 : 0.3)
      .on("click", function (d) {
          onDegreeClicked(d.data.key);
       })
      .append('title')
        .text(function(d){return d.data.key});

    const centerText2 = base2.selectAll('#pieLabelP').data([null]);
    centerText2.enter().append("text")
      .merge(centerText2)
        .attr("id", "pieLabelP")
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("font-weight", "700")
        .style("font-size",  choose.Grado == valDefault.Grado ? "3rem" : "5rem")
        .style("cursor","default")
        .style("fill", colorScaler(choose.Grado))
        .text(	
                choose.Grado == valDefault.Grado ?
                  "Alunni"
                :
                  Math.round(percentsP[choose.Grado]/Object.values(percentsP).reduce((a,b)=>a+b,0)*100)+"%"
             )
}