(function (d3) {
  'use strict';

  const loadAndProcData = (props) => {
      const {
        name_format,
        filterFun,
        valDefault,
        loadedData
      } = props;
    
    
    	const loadFormat = (name) => {
  			const stopwords = ["di","sul","in","del","d"];
        const words = name.toLowerCase().replace("'"," ' ").split(" ");
       
        var newName = words.map((word) => { 
                              if (!stopwords.includes(word)){
                                return word[0].toUpperCase() + word.substring(1); 
                              }else {
                                return word;
                              }
                            }).join(" ").replace(" ' ","'").trim();

  			return (newName);
  		};
    
  		//formatting dati
    	let data = loadedData; 
      data.forEach(d => {
          d.Luogo = loadFormat(d.Luogo);
          d.Grado = d.Grado.replaceAll("_", " ");
          d.Popolazione = +d.Popolazione;
          d.Classi = +d.Classi;
      });
    	
    	//console.log(data)
  		//somme su tutta la regione 
      (d3.map(data,(d=>d.Anno)).keys()).forEach(function(y) {
      		(d3.map(data,(d=>d.Grado)).keys()).forEach(function(g) {
          	data.unshift({	
                            Luogo: valDefault.Luogo,
                            Anno: +y,
                            Grado: g,
                            Popolazione:data.filter(d=>filterFun(d,d.Luogo,g,+y))
                                            .map(d=>d.Popolazione)
                                            .reduce((a,b)=>a+b,0),
                            Classi:data.filter(d=>filterFun(d,d.Luogo,g,+y))
                                            .map(d=>d.Classi)
                                            .reduce((a,b)=>a+b,0)
                      	});
          });
      });
    
    	//somme su tutti i gradi 
      (d3.map(data,(d=>d.Anno)).keys()).forEach(function(y) {
          (d3.map(data,(d=>d.Luogo)).keys()).forEach(function(l) {
              if (l !== valDefault.Luogo){
                data.unshift({	
                              Luogo: l,
                              Anno: +y,
                              Grado: valDefault.Grado,
                              Popolazione:data.filter(d=>filterFun(d,l,d.Grado,+y))
                                              .map(d=>d.Popolazione)
                                              .reduce((a,b)=>a+b,0),
                              Classi:data.filter(d=>filterFun(d,l,d.Grado,+y))
                                              .map(d=>d.Classi)
                                              .reduce((a,b)=>a+b,0)
                         });
              }
          });
      });
    
    	//somme su tutta la regione e tutti i gradi
      (d3.map(data,(d=>d.Anno)).keys()).forEach(function(y) {
          data.unshift({	
                          Luogo: valDefault.Luogo,
                          Anno: +y,
                          Grado: valDefault.Grado,
                          Popolazione:data.filter(d=>filterFun(d,d.Luogo,d.Grado,+y))
                                          .map(d=>d.Popolazione)
                                          .reduce((a,b)=>a+b,0),
                          Classi:data.filter(d=>filterFun(d,d.Luogo,d.Grado,+y))
                                          .map(d=>d.Classi)
                                          .reduce((a,b)=>a+b,0)
                      });
      
      });    
    	
  		return data;

  };

  const mapPlot = (selection, props) => {
    const {
      valDefault,
      name_format,
      colorScaler,
      onPlaceClicked,
      filterFun,
      choose,
      data
    } = props;
    
      const mappa = d3.select('#mappa');
      const luoghi = mappa.selectAll('#mappa > *');
      
      //tutti luoghi filtrati
      const luoghiFiltrati = data
      												.filter(d=>d.Luogo!=valDefault.Luogo)
      												.filter(d=>filterFun(d,d.Luogo,choose.Grado,choose.Anno));
    
    	//scaler dell'opacità sulla Popolazione
      const opacityScaler = d3.scalePow()
      .exponent(0.2)
      .domain(d3.extent(luoghiFiltrati//.filter(d => !["Potenza","Matera"].includes(d.Luogo))
                     							 .map(d => d.Popolazione)
                    							 
                    )) 
      .range([1, 0.2]);
      
      luoghi.each(function() {
      	let luogo = d3.select(this);

        luogo
          .enter()	
        	.merge(luogo)
         		.style("fill", () => ((name_format(this.id) === choose.Luogo) ? "#fff" : colorScaler(choose.Grado)))
        		.style("opacity", () => ((name_format(this.id) === choose.Luogo) ? 
                                     		1
                                     :           		
                                          /*(["Potenza","Matera"].includes(name_format(this.id))) ?
                                            0.2
                                          :*/
                                            opacityScaler(luoghiFiltrati.find(d => d.Luogo === name_format(this.id)).Popolazione)

                  									))
        		.on("mouseover", function (d) {
                d3.select(this)
                  .style("stroke", "#fff")
                  .style("stroke-width", 3)
                  .style("opacity", 1);
             })
            .on("mouseout", function (d) {
                d3.select(this)
                  .style("stroke", "#1B1725")
                  .style("stroke-width", 2)
                  .style("opacity", ((name_format(this.id) === choose.Luogo) ? 
                                     		1
                                     :
                                     		opacityScaler(luoghiFiltrati.find(d => d.Luogo === name_format(this.id)).Popolazione))
                  									);
             })
        		.on("click", function (d) {
            	onPlaceClicked(name_format(this.id));
        		 })
        		.append('title')
            	.text(name_format(this.id));
       
      });	
    
  };

  const piePlot = (selection, props) => {
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
  	var tmpP = d3.nest()
      .key(d =>d.Grado)
      .rollup(d=> d[0].Popolazione)
      .entries(dataTmp);
    var percentsP = {};
    tmpP.forEach(d=>percentsP[d.key] = d.value);
    
    var tmpC = d3.nest()
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
      		.attr("id", "torta");
    	contEnter
      	.merge(contP);
    	
  	//disegna primo chart
    
    // set the dimensions and margins of the graph
    var width1 = 200;
    var height1 = 200;
    var margin1 = 30;

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    var radius1 = Math.min(width1, height1) / 2 - margin1;

    //Compute the position of each group on the pie:
    var donut1 = d3.pie()
      .value(function(d) {return d.value; });
    var data_ready = donut1(d3.entries(percentsC));

    // append the svg object to the div called 'my_dataviz'
    const chart1 = contP.select("#donut1");
      const chart1Enter = contEnter
        .append("g")
          .attr("id", "donut1")
          .attr("transform", "translate(" + 100 + "," + 140  + ")");
      const base1 = chart1Enter
        .merge(chart1);

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
     const parts1 = base1.selectAll('path').data(data_ready);
      parts1.enter().append('path')
        .merge(parts1)
        .attr('d', d3.arc()
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
    var width2 = 280;
    var height2 = 280;
    var margin2 = 20;

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    var radius2 = Math.min(width2, height2) / 2 - margin2;

    // Compute the position of each group on the pie:
    var donut2 = d3.pie()
      .value(function(d) {return d.value; });
    var data_ready = donut2(d3.entries(percentsP));

    // append the svg object to the div called 'my_dataviz'
    const chart2 = contP.selectAll("#donut2");
      const chart2Enter = contEnter
        .append("g")
          .attr("id", "donut2")
          .attr("transform", "translate(" + 320 + "," + 260  + ")");
      const base2 = chart2Enter
        .merge(chart2);

     // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
     const parts2 = base2.selectAll('path').data(data_ready);
      parts2.enter().append('path')
        .merge(parts2)
        .attr('d', d3.arc()
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
               );
  };

  const linePlot = (selection, props) => {
    const {
      valDefault,
      name_format,
      colorScaler,
      onYearClicked,
      filterFun,
      choose,
      loadedData
    } = props;
    
    //parsing dell'anno e filtro 
    const parseYear = d3.timeParse("%Y");
    let data = structuredClone(loadedData)
    						.filter(d=>d.Grado!=valDefault.Grado)
    						.filter(d=>filterFun(d,choose.Luogo,d.Grado,d.Anno));
      data.forEach(d => {
          d.Anno = parseYear(d.Anno);
      });
    
    //inizializzazione
    const innerWidth = 400;
    const innerHeight = 300;
    const xValue = d => d.Anno;
    const yValue = d => d.Popolazione;
    const nTicksX = d3.map(data,(d=>d.Anno)).keys().length;
    
    //groupby
    const nested = d3.nest()
      .key(d => d.Grado)
      .entries(data);
    
    //disegna container svg
    const contP = selection.selectAll("#andamento")
      .data([null]);
    const contEnter = contP					
      	.enter().append("svg")		
      		.attr("id", "andamento");
    const cont = contEnter
      	.merge(contP);

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, xValue))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, yValue))
      .range([innerHeight, 0])
      .nice();
    
    const g = cont.selectAll('.containerL').data([null]);
    const gEnter = g.enter()
      .append('g')
        .attr('class', 'containerL');
    gEnter.merge(g)
      .attr('transform', `translate(50,50)`);
    
    const xAxis = d3.axisBottom(xScale)
    	.ticks(nTicksX)
      .tickSize(-innerHeight)
    	.tickFormat(d3.timeFormat("%Y"))
      .tickPadding(15);
    
    const yAxisTickFormat = number =>
      d3.format('.2s')(number)
        .replace('.0', '');

    const yAxis = d3.axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(yAxisTickFormat)
      .tickPadding(10);
    
    const yAxisGEnter = gEnter
      .append('g')
        .attr('class', 'y-axis');
    const yAxisG = g.select('.y-axis');
    yAxisGEnter
      .merge(yAxisG)
        .call(yAxis)
        .selectAll('.domain').remove();
    
    const xAxisGEnter = gEnter
      .append('g')
        .attr('class', 'x-axis');
    const xAxisG = g.select('.x-axis');
    xAxisGEnter
      .merge(xAxisG)
        .call(xAxis)
        .attr('transform', `translate(0,${innerHeight})`)
    		.selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)")
        .select('.domain').remove();
   
    //disegno delle linee 
    const lineGenerator = d3.line()
      .x(d => xScale(xValue(d)))
      .y(d => yScale(yValue(d)))
      .curve(d3.curveBasis);
    
    const linePaths = g.merge(gEnter)
      .selectAll('.line-path').data(nested);
    linePaths
      .enter().append('path')
        .attr('class', 'line-path')
      .merge(linePaths)
        .attr('d', d => lineGenerator(d.values))
        .attr('stroke', d => colorScaler(d.key))
    		.style("opacity", d=>(d.key == choose.Grado) ? 1 : 0.3)
    		.attr('fill','none')
    		.attr('stroke-width', 4)
    		.attr('stroke-linecap', 'round');
  	
    //disegno del selettore
    gEnter
      .append('line')
        .attr('class', 'selected-year-line')
        .attr('y1', 0)
      .merge(g.select('.selected-year-line'))
        .attr('x1', xScale(parseYear(choose.Anno)))
        .attr('x2', xScale(parseYear(choose.Anno)))
        .attr('y2', innerHeight);
    		
    gEnter
      .append('rect')
        .attr('class', 'mouse-interceptor')
        .attr('fill', 'none')
    		.style('cursor','pointer')
        .attr('pointer-events', 'all')
    		.attr('pointer-events', 'all')
      .merge(g.select('.mouse-interceptor'))
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .on('click', function() {
          const x = d3.mouse(this)[0];
          const hoveredDate = xScale.invert(x+10);
          onYearClicked(String(hoveredDate.getFullYear()));
        });

  };

  const dropdownMenu = (selection, props) => {
    const {
      id,
      options,
      onOptionClicked,
      selectedOption,
      firstEl,
      asc
    } = props;
    
    let wrap = selection.selectAll("#"+id).data([null]);
    wrap = wrap.enter().append('div')
        .attr("id", id)
    		.attr("class", "wrap-select")
    	.merge(wrap);
    
    let select = wrap.selectAll('select').data([null]);
    select = select.enter().append('select')
      .merge(select)
        .on('change', function() {
          onOptionClicked(this.value);
        });
    
    const smartSort = function(elem, exept, asc){
      let tmp;
      if (exept){
        let pivot = elem.find(d=>d === exept);
        tmp = elem.filter(d=>d !== exept);
        tmp = tmp.sort();
        asc === false ? tmp.reverse() : null;
        tmp.unshift(pivot);
      }else {
      	tmp = elem.sort();
        asc === false ? tmp.reverse() : null;
      }
      return (tmp);
    };
    
    const option = select.selectAll('option').data(smartSort(options,firstEl,asc));
    option.enter().append('option')
      .merge(option)
        .attr('value', d => d)
        .property('selected', d => d === selectedOption)
        .text(d => d);
  };

  function numberWithPoint(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  const controlPanel = (selection, props) => {
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
      		.attr("id", "ctrl-panel");
    	ctrlEnter
      	.merge(ctrlP);

    //disegno head del pannello
    const headP = ctrlP.select("#head-panel");
    const headEnter = ctrlEnter
    	.append("div")
    		.attr("id", "head-panel");
    	headP
      	.merge(headEnter)
    			.style("color", colorScaler(choose.Grado))
    			.text("Scuola Basilicata");
    
    //disegno body del pannello
    const bodyP = ctrlP.select("#body-panel");
    const bodyEnter = ctrlEnter
    	.append("div")
    		.attr("id", "body-panel");
    	bodyP
      	.merge(bodyEnter)
        .call(dropdownMenu, {
        	id:"place",
          options: d3.map(data,d=>d.Luogo).keys(),
          onOptionClicked: onPlaceClicked,
          selectedOption: choose.Luogo,
        	firstEl:valDefault.Luogo,
        	asc: true
        })
    		.call(dropdownMenu, {
        	id:"degree",
          options: d3.map(data,(d=>d.Grado)).keys(),
          onOptionClicked: onDegreeClicked,
          selectedOption: choose.Grado,
        	firstEl:valDefault.Grado,
        	asc: true
        })
    		.call(dropdownMenu, {
        	id:"year",
          options: d3.map(data,(d=>d.Anno)).keys(),
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
    		.attr("id", "label0");
    	l0
      	.merge(l0Enter)
    			.text("Alunni registrati: ")
    			.append("span")
    			.text(numberWithPoint(Pop));
    
    const l1 = labelP.select("#label1");
    const l1Enter = labelEnter
    	.append("label")
    		.attr("id", "label1");
    	l1
      	.merge(l1Enter)
    			.text("Classi registrate: ")
    			.append("span")
    			.text(numberWithPoint(Cls));
    
    const l2 = labelP.select("#label2");
    const l2Enter = labelEnter
    	.append("label")
    		.attr("id", "label2");
    	l2
      	.merge(l2Enter)
    			.text("Alunni per classe: ")
    			.append("span")
    			.text(numberWithPoint(Avg ? Avg : 0));
    
  };

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

  const filterFun = function(d,luogo,grado,anno){
    if 	(d.Luogo==luogo && d.Grado==grado && d.Anno==anno) return true
    else return false
  };

  //caricamento unico della mappa
  d3.xml("mappa.svg").then(d => {
      d3.select("body").node()
        .append(d.documentElement);
    	render();
  });

  //funzione di render
  const render = () => {
    
    //mappa colori
  	const colorScaler = d3.scaleOrdinal();
  	colorScaler
  		.domain(d3.map(data,(d=>d.Grado)).keys()) 
    	.range(["#c1b2abff","#92374dff", "#8c5383ff", "#4a5899ff", "#559cadff"]);
    	
    //pannello di controllo laterale
    d3.select("body").call(controlPanel, {
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
    d3.select("body").call(mapPlot, {
      valDefault: valDefault,
      name_format: name_format,
      colorScaler: colorScaler,
      onPlaceClicked: onPlaceClicked,
      filterFun: filterFun,
      choose: choose,
      data: data
    });
    
    //torte
    d3.select("body").call(piePlot, {
      valDefault: valDefault,
      name_format: name_format,
      colorScaler: colorScaler,
      onDegreeClicked: onDegreeClicked,
      filterFun: filterFun,
      choose: choose,
      data: data
    });
    
    //andamento
    d3.select("body").call(linePlot, {
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
  d3.json('dataset.json')
    .then(d => {
        data = loadAndProcData({
        valDefault:valDefault,
        name_format: name_format,
        filterFun: filterFun,
        loadedData: d
      });
    render();
  });

}(d3));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbImxvYWRBbmRQcm9jRGF0YS5qcyIsIm1hcFBsb3QuanMiLCJwaWVQbG90LmpzIiwibGluZVBsb3QuanMiLCJkcm9wZG93bk1lbnUuanMiLCJjb250cm9sUGFuZWwuanMiLCJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBqc29uLFxuICBtYXBcbn0gZnJvbSAnZDMnO1xuXG5leHBvcnQgY29uc3QgbG9hZEFuZFByb2NEYXRhID0gKHByb3BzKSA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgbmFtZV9mb3JtYXQsXG4gICAgICBmaWx0ZXJGdW4sXG4gICAgICB2YWxEZWZhdWx0LFxuICAgICAgbG9hZGVkRGF0YVxuICAgIH0gPSBwcm9wcztcbiAgXG4gIFxuICBcdGNvbnN0IGxvYWRGb3JtYXQgPSAobmFtZSkgPT4ge1xuXHRcdFx0Y29uc3Qgc3RvcHdvcmRzID0gW1wiZGlcIixcInN1bFwiLFwiaW5cIixcImRlbFwiLFwiZFwiXTtcbiAgICAgIGNvbnN0IHdvcmRzID0gbmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoXCInXCIsXCIgJyBcIikuc3BsaXQoXCIgXCIpO1xuICAgICBcbiAgICAgIHZhciBuZXdOYW1lID0gd29yZHMubWFwKCh3b3JkKSA9PiB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc3RvcHdvcmRzLmluY2x1ZGVzKHdvcmQpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB3b3JkWzBdLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnN1YnN0cmluZygxKTsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gd29yZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmpvaW4oXCIgXCIpLnJlcGxhY2UoXCIgJyBcIixcIidcIikudHJpbSgpO1xuXG5cdFx0XHRyZXR1cm4gKG5ld05hbWUpO1xuXHRcdH07XG4gIFxuXHRcdC8vZm9ybWF0dGluZyBkYXRpXG4gIFx0bGV0IGRhdGEgPSBsb2FkZWREYXRhOyBcbiAgICBkYXRhLmZvckVhY2goZCA9PiB7XG4gICAgICAgIGQuTHVvZ28gPSBsb2FkRm9ybWF0KGQuTHVvZ28pO1xuICAgICAgICBkLkdyYWRvID0gZC5HcmFkby5yZXBsYWNlQWxsKFwiX1wiLCBcIiBcIik7XG4gICAgICAgIGQuUG9wb2xhemlvbmUgPSArZC5Qb3BvbGF6aW9uZTtcbiAgICAgICAgZC5DbGFzc2kgPSArZC5DbGFzc2k7XG4gICAgfSk7XG4gIFx0XG4gIFx0Ly9jb25zb2xlLmxvZyhkYXRhKVxuXHRcdC8vc29tbWUgc3UgdHV0dGEgbGEgcmVnaW9uZSBcbiAgICAobWFwKGRhdGEsKGQ9PmQuQW5ubykpLmtleXMoKSkuZm9yRWFjaChmdW5jdGlvbih5KSB7XG4gICAgXHRcdChtYXAoZGF0YSwoZD0+ZC5HcmFkbykpLmtleXMoKSkuZm9yRWFjaChmdW5jdGlvbihnKSB7XG4gICAgICAgIFx0ZGF0YS51bnNoaWZ0KHtcdFxuICAgICAgICAgICAgICAgICAgICAgICAgICBMdW9nbzogdmFsRGVmYXVsdC5MdW9nbyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgQW5ubzogK3ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIEdyYWRvOiBnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBQb3BvbGF6aW9uZTpkYXRhLmZpbHRlcihkPT5maWx0ZXJGdW4oZCxkLkx1b2dvLGcsK3kpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChkPT5kLlBvcG9sYXppb25lKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlZHVjZSgoYSxiKT0+YStiLDApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBDbGFzc2k6ZGF0YS5maWx0ZXIoZD0+ZmlsdGVyRnVuKGQsZC5MdW9nbyxnLCt5KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZD0+ZC5DbGFzc2kpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVkdWNlKChhLGIpPT5hK2IsMClcbiAgICAgICAgICAgICAgICAgICAgXHR9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIFxuICBcdC8vc29tbWUgc3UgdHV0dGkgaSBncmFkaSBcbiAgICAobWFwKGRhdGEsKGQ9PmQuQW5ubykpLmtleXMoKSkuZm9yRWFjaChmdW5jdGlvbih5KSB7XG4gICAgICAgIChtYXAoZGF0YSwoZD0+ZC5MdW9nbykpLmtleXMoKSkuZm9yRWFjaChmdW5jdGlvbihsKSB7XG4gICAgICAgICAgICBpZiAobCAhPT0gdmFsRGVmYXVsdC5MdW9nbyl7XG4gICAgICAgICAgICAgIGRhdGEudW5zaGlmdCh7XHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMdW9nbzogbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbm5vOiAreSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHcmFkbzogdmFsRGVmYXVsdC5HcmFkbyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBQb3BvbGF6aW9uZTpkYXRhLmZpbHRlcihkPT5maWx0ZXJGdW4oZCxsLGQuR3JhZG8sK3kpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGQ9PmQuUG9wb2xhemlvbmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZWR1Y2UoKGEsYik9PmErYiwwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDbGFzc2k6ZGF0YS5maWx0ZXIoZD0+ZmlsdGVyRnVuKGQsbCxkLkdyYWRvLCt5KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChkPT5kLkNsYXNzaSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlZHVjZSgoYSxiKT0+YStiLDApXG4gICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgXG4gIFx0Ly9zb21tZSBzdSB0dXR0YSBsYSByZWdpb25lIGUgdHV0dGkgaSBncmFkaVxuICAgIChtYXAoZGF0YSwoZD0+ZC5Bbm5vKSkua2V5cygpKS5mb3JFYWNoKGZ1bmN0aW9uKHkpIHtcbiAgICAgICAgZGF0YS51bnNoaWZ0KHtcdFxuICAgICAgICAgICAgICAgICAgICAgICAgTHVvZ286IHZhbERlZmF1bHQuTHVvZ28sXG4gICAgICAgICAgICAgICAgICAgICAgICBBbm5vOiAreSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEdyYWRvOiB2YWxEZWZhdWx0LkdyYWRvLFxuICAgICAgICAgICAgICAgICAgICAgICAgUG9wb2xhemlvbmU6ZGF0YS5maWx0ZXIoZD0+ZmlsdGVyRnVuKGQsZC5MdW9nbyxkLkdyYWRvLCt5KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGQ9PmQuUG9wb2xhemlvbmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlZHVjZSgoYSxiKT0+YStiLDApLFxuICAgICAgICAgICAgICAgICAgICAgICAgQ2xhc3NpOmRhdGEuZmlsdGVyKGQ9PmZpbHRlckZ1bihkLGQuTHVvZ28sZC5HcmFkbywreSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChkPT5kLkNsYXNzaSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVkdWNlKChhLGIpPT5hK2IsMClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgfSk7ICAgIFxuICBcdFxuXHRcdHJldHVybiBkYXRhO1xuXG59IiwiaW1wb3J0IHtcbiAgc2VsZWN0LFxuICB4bWwsXG4gIHN2ZyxcbiAgc2NhbGVMaW5lYXIsXG4gIHNjYWxlUG93LFxuICBleHRlbnRcbn0gZnJvbSAnZDMnO1xuXG5leHBvcnQgY29uc3QgbWFwUGxvdCA9IChzZWxlY3Rpb24sIHByb3BzKSA9PiB7XG4gIGNvbnN0IHtcbiAgICB2YWxEZWZhdWx0LFxuICAgIG5hbWVfZm9ybWF0LFxuICAgIGNvbG9yU2NhbGVyLFxuICAgIG9uUGxhY2VDbGlja2VkLFxuICAgIGZpbHRlckZ1bixcbiAgICBjaG9vc2UsXG4gICAgZGF0YVxuICB9ID0gcHJvcHM7XG4gIFxuICAgIGNvbnN0IG1hcHBhID0gc2VsZWN0KCcjbWFwcGEnKTtcbiAgICBjb25zdCBsdW9naGkgPSBtYXBwYS5zZWxlY3RBbGwoJyNtYXBwYSA+IConKTtcbiAgICBcbiAgICAvL3R1dHRpIGx1b2doaSBmaWx0cmF0aVxuICAgIGNvbnN0IGx1b2doaUZpbHRyYXRpID0gZGF0YVxuICAgIFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5maWx0ZXIoZD0+ZC5MdW9nbyE9dmFsRGVmYXVsdC5MdW9nbylcbiAgICBcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQuZmlsdGVyKGQ9PmZpbHRlckZ1bihkLGQuTHVvZ28sY2hvb3NlLkdyYWRvLGNob29zZS5Bbm5vKSk7XG4gIFxuICBcdC8vc2NhbGVyIGRlbGwnb3BhY2l0w4PCoCBzdWxsYSBQb3BvbGF6aW9uZVxuICAgIGNvbnN0IG9wYWNpdHlTY2FsZXIgPSBzY2FsZVBvdygpXG4gICAgLmV4cG9uZW50KDAuMilcbiAgICAuZG9tYWluKGV4dGVudChsdW9naGlGaWx0cmF0aS8vLmZpbHRlcihkID0+ICFbXCJQb3RlbnphXCIsXCJNYXRlcmFcIl0uaW5jbHVkZXMoZC5MdW9nbykpXG4gICAgICAgICAgICAgICAgICAgXHRcdFx0XHRcdFx0XHQgLm1hcChkID0+IGQuUG9wb2xhemlvbmUpXG4gICAgICAgICAgICAgICAgICBcdFx0XHRcdFx0XHRcdCBcbiAgICAgICAgICAgICAgICAgICkpIFxuICAgIC5yYW5nZShbMSwgMC4yXSk7XG4gICAgXG4gICAgbHVvZ2hpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgXHRsZXQgbHVvZ28gPSBzZWxlY3QodGhpcyk7XG5cbiAgICAgIGx1b2dvXG4gICAgICAgIC5lbnRlcigpXHRcbiAgICAgIFx0Lm1lcmdlKGx1b2dvKVxuICAgICAgIFx0XHQuc3R5bGUoXCJmaWxsXCIsICgpID0+ICgobmFtZV9mb3JtYXQodGhpcy5pZCkgPT09IGNob29zZS5MdW9nbykgPyBcIiNmZmZcIiA6IGNvbG9yU2NhbGVyKGNob29zZS5HcmFkbykpKVxuICAgICAgXHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgKCkgPT4gKChuYW1lX2Zvcm1hdCh0aGlzLmlkKSA9PT0gY2hvb3NlLkx1b2dvKSA/IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcdFx0MVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICAgICAgICAgICBcdFx0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyooW1wiUG90ZW56YVwiLFwiTWF0ZXJhXCJdLmluY2x1ZGVzKG5hbWVfZm9ybWF0KHRoaXMuaWQpKSkgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMC4yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGFjaXR5U2NhbGVyKGx1b2doaUZpbHRyYXRpLmZpbmQoZCA9PiBkLkx1b2dvID09PSBuYW1lX2Zvcm1hdCh0aGlzLmlkKSkuUG9wb2xhemlvbmUpXG5cbiAgICAgICAgICAgICAgICBcdFx0XHRcdFx0XHRcdFx0XHQpKVxuICAgICAgXHRcdC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICBzZWxlY3QodGhpcylcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJzdHJva2VcIiwgXCIjZmZmXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDMpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCAxKTtcbiAgICAgICAgICAgfSlcbiAgICAgICAgICAub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICBzZWxlY3QodGhpcylcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJzdHJva2VcIiwgXCIjMUIxNzI1XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCAoKG5hbWVfZm9ybWF0KHRoaXMuaWQpID09PSBjaG9vc2UuTHVvZ28pID8gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx0XHQxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHRcdG9wYWNpdHlTY2FsZXIobHVvZ2hpRmlsdHJhdGkuZmluZChkID0+IGQuTHVvZ28gPT09IG5hbWVfZm9ybWF0KHRoaXMuaWQpKS5Qb3BvbGF6aW9uZSkpXG4gICAgICAgICAgICAgICAgXHRcdFx0XHRcdFx0XHRcdFx0KTtcbiAgICAgICAgICAgfSlcbiAgICAgIFx0XHQub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgIFx0b25QbGFjZUNsaWNrZWQobmFtZV9mb3JtYXQodGhpcy5pZCkpO1xuICAgICAgXHRcdCB9KVxuICAgICAgXHRcdC5hcHBlbmQoJ3RpdGxlJylcbiAgICAgICAgICBcdC50ZXh0KG5hbWVfZm9ybWF0KHRoaXMuaWQpKTtcbiAgICAgXG4gICAgfSk7XHRcbiAgXG59IiwiaW1wb3J0IHtcbiAgc2VsZWN0LFxuICBtYXAsXG4gIHN2ZyxcbiAgc2NhbGVPcmRpbmFsLFxuICBleHRlbnQsXG4gIHBpZSxcbiAgYXJjLFxuICBlbnRyaWVzLFxuICBuZXN0XG59IGZyb20gJ2QzJztcblxuZXhwb3J0IGNvbnN0IHBpZVBsb3QgPSAoc2VsZWN0aW9uLCBwcm9wcykgPT4ge1xuICBjb25zdCB7XG4gICAgdmFsRGVmYXVsdCxcbiAgICBuYW1lX2Zvcm1hdCxcbiAgICBjb2xvclNjYWxlcixcbiAgICBvbkRlZ3JlZUNsaWNrZWQsXG4gICAgZmlsdGVyRnVuLFxuICAgIGNob29zZSxcbiAgICBkYXRhXG4gIH0gPSBwcm9wcztcblxuICAvL2dlbmVyYSBwZXJjZW50dWFsaVxuICB2YXIgZGF0YVRtcCA9IGRhdGEuZmlsdGVyKGQ9PmQuR3JhZG8hPXZhbERlZmF1bHQuR3JhZG8pXG4gIFx0XHRcdFx0XHRcdFx0XHRcdC5maWx0ZXIoZD0+ZmlsdGVyRnVuKGQsY2hvb3NlLkx1b2dvLGQuR3JhZG8sY2hvb3NlLkFubm8pKTtcblx0dmFyIHRtcFAgPSBuZXN0KClcbiAgICAua2V5KGQgPT5kLkdyYWRvKVxuICAgIC5yb2xsdXAoZD0+IGRbMF0uUG9wb2xhemlvbmUpXG4gICAgLmVudHJpZXMoZGF0YVRtcCk7XG4gIHZhciBwZXJjZW50c1AgPSB7fTtcbiAgdG1wUC5mb3JFYWNoKGQ9PnBlcmNlbnRzUFtkLmtleV0gPSBkLnZhbHVlKTtcbiAgXG4gIHZhciB0bXBDID0gbmVzdCgpXG4gICAgLmtleShkID0+ZC5HcmFkbylcbiAgICAucm9sbHVwKGQ9PiBkWzBdLkNsYXNzaSlcbiAgICAuZW50cmllcyhkYXRhVG1wKTtcbiAgdmFyIHBlcmNlbnRzQyA9IHt9O1xuICB0bXBDLmZvckVhY2goZD0+cGVyY2VudHNDW2Qua2V5XSA9IGQudmFsdWUpO1xuIFxuICAvKlxuICBsZXQgZGF0YVRtcCA9IGRhdGEuZmlsdGVyKGQ9PmQuR3JhZG8hPXZhbERlZmF1bHQuR3JhZG8pO1xuICAobWFwKGRhdGFUbXAsKGQ9PmQuR3JhZG8pKS5rZXlzKCkpLmZvckVhY2goZnVuY3Rpb24oZykge1xuICBcdCBwZXJjZW50c1BbZ10gPSBkYXRhVG1wLmZpbHRlcihkPT5maWx0ZXJGdW4oZCxjaG9vc2UuTHVvZ28sZyxjaG9vc2UuQW5ubykpXG4gICAgXHRcdFx0XHQgXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5tYXAoZD0+ZC5Qb3BvbGF6aW9uZSlcbiAgICAgICAgICAgICBcdFx0XHRcdFx0XHRcdFx0XHRcdFx0LnJlZHVjZSgoYSxiKT0+YStiLDApO1xuICAgICBwZXJjZW50c0NbZ10gPSBkYXRhVG1wLmZpbHRlcihkPT5maWx0ZXJGdW4oZCxjaG9vc2UuTHVvZ28sZyxjaG9vc2UuQW5ubykpXG4gICAgXHRcdFx0XHQgXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5tYXAoZD0+ZC5DbGFzc2kpXG4gICAgICAgICAgICAgXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5yZWR1Y2UoKGEsYik9PmErYiwwKTtcbiAgfSk7ICovICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICBcbiAgLy9kaXNlZ25hIGNvbnRhaW5lclxuICBjb25zdCBjb250UCA9IHNlbGVjdGlvbi5zZWxlY3RBbGwoXCIjdG9ydGFcIilcbiAgICAuZGF0YShbbnVsbF0pO1xuICBjb25zdCBjb250RW50ZXIgPSBjb250UFx0XHRcdFx0XHRcbiAgICBcdC5lbnRlcigpLmFwcGVuZChcInN2Z1wiKVx0XHRcbiAgICBcdFx0LmF0dHIoXCJpZFwiLCBcInRvcnRhXCIpXG4gIFx0Y29udEVudGVyXG4gICAgXHQubWVyZ2UoY29udFApXG4gIFx0XG5cdC8vZGlzZWduYSBwcmltbyBjaGFydFxuICBcbiAgLy8gc2V0IHRoZSBkaW1lbnNpb25zIGFuZCBtYXJnaW5zIG9mIHRoZSBncmFwaFxuICB2YXIgd2lkdGgxID0gMjAwXG4gIHZhciBoZWlnaHQxID0gMjAwXG4gIHZhciBtYXJnaW4xID0gMzBcblxuICAvLyBUaGUgcmFkaXVzIG9mIHRoZSBwaWVwbG90IGlzIGhhbGYgdGhlIHdpZHRoIG9yIGhhbGYgdGhlIGhlaWdodCAoc21hbGxlc3Qgb25lKS4gSSBzdWJ0cmFjdCBhIGJpdCBvZiBtYXJnaW4uXG4gIHZhciByYWRpdXMxID0gTWF0aC5taW4od2lkdGgxLCBoZWlnaHQxKSAvIDIgLSBtYXJnaW4xXG5cbiAgLy9Db21wdXRlIHRoZSBwb3NpdGlvbiBvZiBlYWNoIGdyb3VwIG9uIHRoZSBwaWU6XG4gIHZhciBkb251dDEgPSBwaWUoKVxuICAgIC52YWx1ZShmdW5jdGlvbihkKSB7cmV0dXJuIGQudmFsdWU7IH0pXG4gIHZhciBkYXRhX3JlYWR5ID0gZG9udXQxKGVudHJpZXMocGVyY2VudHNDKSlcblxuICAvLyBhcHBlbmQgdGhlIHN2ZyBvYmplY3QgdG8gdGhlIGRpdiBjYWxsZWQgJ215X2RhdGF2aXonXG4gIGNvbnN0IGNoYXJ0MSA9IGNvbnRQLnNlbGVjdChcIiNkb251dDFcIik7XG4gICAgY29uc3QgY2hhcnQxRW50ZXIgPSBjb250RW50ZXJcbiAgICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiaWRcIiwgXCJkb251dDFcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyAxMDAgKyBcIixcIiArIDE0MCAgKyBcIilcIik7XG4gICAgY29uc3QgYmFzZTEgPSBjaGFydDFFbnRlclxuICAgICAgLm1lcmdlKGNoYXJ0MSlcblxuICAvLyBCdWlsZCB0aGUgcGllIGNoYXJ0OiBCYXNpY2FsbHksIGVhY2ggcGFydCBvZiB0aGUgcGllIGlzIGEgcGF0aCB0aGF0IHdlIGJ1aWxkIHVzaW5nIHRoZSBhcmMgZnVuY3Rpb24uXG4gICBjb25zdCBwYXJ0czEgPSBiYXNlMS5zZWxlY3RBbGwoJ3BhdGgnKS5kYXRhKGRhdGFfcmVhZHkpO1xuICAgIHBhcnRzMS5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAubWVyZ2UocGFydHMxKVxuICAgICAgLmF0dHIoJ2QnLCBhcmMoKVxuICAgICAgICAuaW5uZXJSYWRpdXMoODUpICAgICAgICAgLy8gVGhpcyBpcyB0aGUgc2l6ZSBvZiB0aGUgZG9udXQgaG9sZVxuICAgICAgICAub3V0ZXJSYWRpdXMocmFkaXVzMSlcbiAgICAgIClcbiAgICAgIC5hdHRyKCdmaWxsJywgZD0+Y29sb3JTY2FsZXIoZC5kYXRhLmtleSkpIFxuICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCIjMUIxNzI1XCIpXG4gICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgXCI1cHhcIilcbiAgICAgIC5zdHlsZShcImN1cnNvclwiLFwicG9pbnRlclwiKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBkPT4oZC5kYXRhLmtleSA9PSBjaG9vc2UuR3JhZG8pID8gMSA6IDAuMylcbiAgICAgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgb25EZWdyZWVDbGlja2VkKGQuZGF0YS5rZXkpO1xuICAgICAgIH0pXG4gICAgICAuYXBwZW5kKCd0aXRsZScpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpe3JldHVybiBkLmRhdGEua2V5fSk7XG5cbiAgICBjb25zdCBjZW50ZXJUZXh0MSA9IGJhc2UxLnNlbGVjdEFsbCgnI3BpZUxhYmVsQycpLmRhdGEoW251bGxdKTtcbiAgICBjZW50ZXJUZXh0MS5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgIC5tZXJnZShjZW50ZXJUZXh0MSlcbiAgICAgICAgLmF0dHIoXCJpZFwiLCBcInBpZUxhYmVsQ1wiKVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiMC4zNWVtXCIpXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBjb2xvclNjYWxlcihjaG9vc2UuR3JhZG8pKVxuICAgICAgICAuYXR0cihcImZvbnQtd2VpZ2h0XCIsIFwiNzAwXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwiZm9udC1zaXplXCIsICBjaG9vc2UuR3JhZG8gPT0gdmFsRGVmYXVsdC5HcmFkbyA/IFwiMnJlbVwiIDogXCIzcmVtXCIpXG4gICAgICAgIC5zdHlsZShcImN1cnNvclwiLFwiZGVmYXVsdFwiKVxuICAgICAgICAudGV4dChcdFxuICAgICAgICAgICAgICAgIGNob29zZS5HcmFkbyA9PSB2YWxEZWZhdWx0LkdyYWRvID9cbiAgICAgICAgICAgICAgICAgIFwiQ2xhc3NpXCJcbiAgICAgICAgICAgICAgICA6XG4gICAgICAgICAgICAgICAgICBNYXRoLnJvdW5kKHBlcmNlbnRzQ1tjaG9vc2UuR3JhZG9dL09iamVjdC52YWx1ZXMocGVyY2VudHNDKS5yZWR1Y2UoKGEsYik9PmErYiwwKSoxMDApK1wiJVwiXG4gICAgICAgICAgICAgKVxuICAgICAgICAuYXBwZW5kKCd0aXRsZScpXG4gICAgICAgICAgLnRleHQoXCJDbGFzc2lcIik7XG4gIFxuXHQvL2Rpc2VnbmEgc2Vjb25kbyBjaGFydFxuICBcbiAgLy8gc2V0IHRoZSBkaW1lbnNpb25zIGFuZCBtYXJnaW5zIG9mIHRoZSBncmFwaFxuICB2YXIgd2lkdGgyID0gMjgwXG4gIHZhciBoZWlnaHQyID0gMjgwXG4gIHZhciBtYXJnaW4yID0gMjBcblxuICAvLyBUaGUgcmFkaXVzIG9mIHRoZSBwaWVwbG90IGlzIGhhbGYgdGhlIHdpZHRoIG9yIGhhbGYgdGhlIGhlaWdodCAoc21hbGxlc3Qgb25lKS4gSSBzdWJ0cmFjdCBhIGJpdCBvZiBtYXJnaW4uXG4gIHZhciByYWRpdXMyID0gTWF0aC5taW4od2lkdGgyLCBoZWlnaHQyKSAvIDIgLSBtYXJnaW4yXG5cbiAgLy8gQ29tcHV0ZSB0aGUgcG9zaXRpb24gb2YgZWFjaCBncm91cCBvbiB0aGUgcGllOlxuICB2YXIgZG9udXQyID0gcGllKClcbiAgICAudmFsdWUoZnVuY3Rpb24oZCkge3JldHVybiBkLnZhbHVlOyB9KVxuICB2YXIgZGF0YV9yZWFkeSA9IGRvbnV0MihlbnRyaWVzKHBlcmNlbnRzUCkpO1xuXG4gIC8vIGFwcGVuZCB0aGUgc3ZnIG9iamVjdCB0byB0aGUgZGl2IGNhbGxlZCAnbXlfZGF0YXZpeidcbiAgY29uc3QgY2hhcnQyID0gY29udFAuc2VsZWN0QWxsKFwiI2RvbnV0MlwiKTtcbiAgICBjb25zdCBjaGFydDJFbnRlciA9IGNvbnRFbnRlclxuICAgICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJpZFwiLCBcImRvbnV0MlwiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIDMyMCArIFwiLFwiICsgMjYwICArIFwiKVwiKTtcbiAgICBjb25zdCBiYXNlMiA9IGNoYXJ0MkVudGVyXG4gICAgICAubWVyZ2UoY2hhcnQyKVxuXG4gICAvLyBCdWlsZCB0aGUgcGllIGNoYXJ0OiBCYXNpY2FsbHksIGVhY2ggcGFydCBvZiB0aGUgcGllIGlzIGEgcGF0aCB0aGF0IHdlIGJ1aWxkIHVzaW5nIHRoZSBhcmMgZnVuY3Rpb24uXG4gICBjb25zdCBwYXJ0czIgPSBiYXNlMi5zZWxlY3RBbGwoJ3BhdGgnKS5kYXRhKGRhdGFfcmVhZHkpO1xuICAgIHBhcnRzMi5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAubWVyZ2UocGFydHMyKVxuICAgICAgLmF0dHIoJ2QnLCBhcmMoKVxuICAgICAgICAuaW5uZXJSYWRpdXMoMTM1KSAgICAgICAgIC8vIFRoaXMgaXMgdGhlIHNpemUgb2YgdGhlIGRvbnV0IGhvbGVcbiAgICAgICAgLm91dGVyUmFkaXVzKHJhZGl1czIpXG4gICAgICApXG4gICAgICAuYXR0cignZmlsbCcsIGQ9PmNvbG9yU2NhbGVyKGQuZGF0YS5rZXkpKSBcbiAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwiIzFCMTcyNVwiKVxuICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIFwiNXB4XCIpXG4gICAgICAuc3R5bGUoXCJjdXJzb3JcIixcInBvaW50ZXJcIilcbiAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgZD0+KGQuZGF0YS5rZXkgPT0gY2hvb3NlLkdyYWRvKSA/IDEgOiAwLjMpXG4gICAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgIG9uRGVncmVlQ2xpY2tlZChkLmRhdGEua2V5KTtcbiAgICAgICB9KVxuICAgICAgLmFwcGVuZCgndGl0bGUnKVxuICAgICAgICAudGV4dChmdW5jdGlvbihkKXtyZXR1cm4gZC5kYXRhLmtleX0pO1xuXG4gICAgY29uc3QgY2VudGVyVGV4dDIgPSBiYXNlMi5zZWxlY3RBbGwoJyNwaWVMYWJlbFAnKS5kYXRhKFtudWxsXSk7XG4gICAgY2VudGVyVGV4dDIuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAubWVyZ2UoY2VudGVyVGV4dDIpXG4gICAgICAgIC5hdHRyKFwiaWRcIiwgXCJwaWVMYWJlbFBcIilcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjAuMzVlbVwiKVxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC5hdHRyKFwiZm9udC13ZWlnaHRcIiwgXCI3MDBcIilcbiAgICAgICAgLnN0eWxlKFwiZm9udC1zaXplXCIsICBjaG9vc2UuR3JhZG8gPT0gdmFsRGVmYXVsdC5HcmFkbyA/IFwiM3JlbVwiIDogXCI1cmVtXCIpXG4gICAgICAgIC5zdHlsZShcImN1cnNvclwiLFwiZGVmYXVsdFwiKVxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGNvbG9yU2NhbGVyKGNob29zZS5HcmFkbykpXG4gICAgICAgIC50ZXh0KFx0XG4gICAgICAgICAgICAgICAgY2hvb3NlLkdyYWRvID09IHZhbERlZmF1bHQuR3JhZG8gP1xuICAgICAgICAgICAgICAgICAgXCJBbHVubmlcIlxuICAgICAgICAgICAgICAgIDpcbiAgICAgICAgICAgICAgICAgIE1hdGgucm91bmQocGVyY2VudHNQW2Nob29zZS5HcmFkb10vT2JqZWN0LnZhbHVlcyhwZXJjZW50c1ApLnJlZHVjZSgoYSxiKT0+YStiLDApKjEwMCkrXCIlXCJcbiAgICAgICAgICAgICApXG59IiwiaW1wb3J0IHtcbiAgc2VsZWN0LFxuICBtYXAsXG4gIHN2ZyxcbiAgc2NhbGVPcmRpbmFsLFxuICBleHRlbnQsXG4gIGVudHJpZXMsXG4gIHNjYWxlTGluZWFyLFxuICBzY2FsZVRpbWUsXG4gIGF4aXNMZWZ0LFxuICBheGlzQm90dG9tLFxuICBsaW5lLFxuICBjdXJ2ZUJhc2lzLFxuICBuZXN0LFxuICBkZXNjZW5kaW5nLFxuICBmb3JtYXQsXG4gIG1vdXNlLFxuICB0aW1lUGFyc2UsXG4gIHRpbWVGb3JtYXRcbn0gZnJvbSAnZDMnO1xuXG5leHBvcnQgY29uc3QgbGluZVBsb3QgPSAoc2VsZWN0aW9uLCBwcm9wcykgPT4ge1xuICBjb25zdCB7XG4gICAgdmFsRGVmYXVsdCxcbiAgICBuYW1lX2Zvcm1hdCxcbiAgICBjb2xvclNjYWxlcixcbiAgICBvblllYXJDbGlja2VkLFxuICAgIGZpbHRlckZ1bixcbiAgICBjaG9vc2UsXG4gICAgbG9hZGVkRGF0YVxuICB9ID0gcHJvcHM7XG4gIFxuICAvL3BhcnNpbmcgZGVsbCdhbm5vIGUgZmlsdHJvIFxuICBjb25zdCBwYXJzZVllYXIgPSB0aW1lUGFyc2UoXCIlWVwiKTtcbiAgbGV0IGRhdGEgPSBzdHJ1Y3R1cmVkQ2xvbmUobG9hZGVkRGF0YSlcbiAgXHRcdFx0XHRcdFx0LmZpbHRlcihkPT5kLkdyYWRvIT12YWxEZWZhdWx0LkdyYWRvKVxuICBcdFx0XHRcdFx0XHQuZmlsdGVyKGQ9PmZpbHRlckZ1bihkLGNob29zZS5MdW9nbyxkLkdyYWRvLGQuQW5ubykpO1xuICAgIGRhdGEuZm9yRWFjaChkID0+IHtcbiAgICAgICAgZC5Bbm5vID0gcGFyc2VZZWFyKGQuQW5ubyk7XG4gICAgfSk7XG4gIFxuICAvL2luaXppYWxpenphemlvbmVcbiAgY29uc3QgaW5uZXJXaWR0aCA9IDQwMDtcbiAgY29uc3QgaW5uZXJIZWlnaHQgPSAzMDA7XG4gIGNvbnN0IHhWYWx1ZSA9IGQgPT4gZC5Bbm5vO1xuICBjb25zdCB5VmFsdWUgPSBkID0+IGQuUG9wb2xhemlvbmU7XG4gIGNvbnN0IG5UaWNrc1ggPSBtYXAoZGF0YSwoZD0+ZC5Bbm5vKSkua2V5cygpLmxlbmd0aFxuICBcbiAgLy9ncm91cGJ5XG4gIGNvbnN0IG5lc3RlZCA9IG5lc3QoKVxuICAgIC5rZXkoZCA9PiBkLkdyYWRvKVxuICAgIC5lbnRyaWVzKGRhdGEpO1xuICBcbiAgLy9kaXNlZ25hIGNvbnRhaW5lciBzdmdcbiAgY29uc3QgY29udFAgPSBzZWxlY3Rpb24uc2VsZWN0QWxsKFwiI2FuZGFtZW50b1wiKVxuICAgIC5kYXRhKFtudWxsXSk7XG4gIGNvbnN0IGNvbnRFbnRlciA9IGNvbnRQXHRcdFx0XHRcdFxuICAgIFx0LmVudGVyKCkuYXBwZW5kKFwic3ZnXCIpXHRcdFxuICAgIFx0XHQuYXR0cihcImlkXCIsIFwiYW5kYW1lbnRvXCIpXG4gIGNvbnN0IGNvbnQgPSBjb250RW50ZXJcbiAgICBcdC5tZXJnZShjb250UClcblxuICBjb25zdCB4U2NhbGUgPSBzY2FsZVRpbWUoKVxuICAgIC5kb21haW4oZXh0ZW50KGRhdGEsIHhWYWx1ZSkpXG4gICAgLnJhbmdlKFswLCBpbm5lcldpZHRoXSk7XG5cbiAgY29uc3QgeVNjYWxlID0gc2NhbGVMaW5lYXIoKVxuICAgIC5kb21haW4oZXh0ZW50KGRhdGEsIHlWYWx1ZSkpXG4gICAgLnJhbmdlKFtpbm5lckhlaWdodCwgMF0pXG4gICAgLm5pY2UoKTtcbiAgXG4gIGNvbnN0IGcgPSBjb250LnNlbGVjdEFsbCgnLmNvbnRhaW5lckwnKS5kYXRhKFtudWxsXSk7XG4gIGNvbnN0IGdFbnRlciA9IGcuZW50ZXIoKVxuICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NvbnRhaW5lckwnKTtcbiAgZ0VudGVyLm1lcmdlKGcpXG4gICAgLmF0dHIoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoNTAsNTApYCk7XG4gIFxuICBjb25zdCB4QXhpcyA9IGF4aXNCb3R0b20oeFNjYWxlKVxuICBcdC50aWNrcyhuVGlja3NYKVxuICAgIC50aWNrU2l6ZSgtaW5uZXJIZWlnaHQpXG4gIFx0LnRpY2tGb3JtYXQodGltZUZvcm1hdChcIiVZXCIpKVxuICAgIC50aWNrUGFkZGluZygxNSk7XG4gIFxuICBjb25zdCB5QXhpc1RpY2tGb3JtYXQgPSBudW1iZXIgPT5cbiAgICBmb3JtYXQoJy4ycycpKG51bWJlcilcbiAgICAgIC5yZXBsYWNlKCcuMCcsICcnKVxuXG4gIGNvbnN0IHlBeGlzID0gYXhpc0xlZnQoeVNjYWxlKVxuICAgIC50aWNrU2l6ZSgtaW5uZXJXaWR0aClcbiAgICAudGlja0Zvcm1hdCh5QXhpc1RpY2tGb3JtYXQpXG4gICAgLnRpY2tQYWRkaW5nKDEwKTtcbiAgXG4gIGNvbnN0IHlBeGlzR0VudGVyID0gZ0VudGVyXG4gICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAneS1heGlzJyk7XG4gIGNvbnN0IHlBeGlzRyA9IGcuc2VsZWN0KCcueS1heGlzJyk7XG4gIHlBeGlzR0VudGVyXG4gICAgLm1lcmdlKHlBeGlzRylcbiAgICAgIC5jYWxsKHlBeGlzKVxuICAgICAgLnNlbGVjdEFsbCgnLmRvbWFpbicpLnJlbW92ZSgpO1xuICBcbiAgY29uc3QgeEF4aXNHRW50ZXIgPSBnRW50ZXJcbiAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd4LWF4aXMnKTtcbiAgY29uc3QgeEF4aXNHID0gZy5zZWxlY3QoJy54LWF4aXMnKTtcbiAgeEF4aXNHRW50ZXJcbiAgICAubWVyZ2UoeEF4aXNHKVxuICAgICAgLmNhbGwoeEF4aXMpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgwLCR7aW5uZXJIZWlnaHR9KWApXG4gIFx0XHQuc2VsZWN0QWxsKFwidGV4dFwiKSAgXG4gICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxuICAgICAgLmF0dHIoXCJkeFwiLCBcIi0uOGVtXCIpXG4gICAgICAuYXR0cihcImR5XCIsIFwiLjE1ZW1cIilcbiAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC02NSlcIilcbiAgICAgIC5zZWxlY3QoJy5kb21haW4nKS5yZW1vdmUoKTtcbiBcbiAgLy9kaXNlZ25vIGRlbGxlIGxpbmVlIFxuICBjb25zdCBsaW5lR2VuZXJhdG9yID0gbGluZSgpXG4gICAgLngoZCA9PiB4U2NhbGUoeFZhbHVlKGQpKSlcbiAgICAueShkID0+IHlTY2FsZSh5VmFsdWUoZCkpKVxuICAgIC5jdXJ2ZShjdXJ2ZUJhc2lzKTtcbiAgXG4gIGNvbnN0IGxpbmVQYXRocyA9IGcubWVyZ2UoZ0VudGVyKVxuICAgIC5zZWxlY3RBbGwoJy5saW5lLXBhdGgnKS5kYXRhKG5lc3RlZCk7XG4gIGxpbmVQYXRoc1xuICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbGluZS1wYXRoJylcbiAgICAubWVyZ2UobGluZVBhdGhzKVxuICAgICAgLmF0dHIoJ2QnLCBkID0+IGxpbmVHZW5lcmF0b3IoZC52YWx1ZXMpKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsIGQgPT4gY29sb3JTY2FsZXIoZC5rZXkpKVxuICBcdFx0LnN0eWxlKFwib3BhY2l0eVwiLCBkPT4oZC5rZXkgPT0gY2hvb3NlLkdyYWRvKSA/IDEgOiAwLjMpXG4gIFx0XHQuYXR0cignZmlsbCcsJ25vbmUnKVxuICBcdFx0LmF0dHIoJ3N0cm9rZS13aWR0aCcsIDQpXG4gIFx0XHQuYXR0cignc3Ryb2tlLWxpbmVjYXAnLCAncm91bmQnKVxuXHRcbiAgLy9kaXNlZ25vIGRlbCBzZWxldHRvcmVcbiAgZ0VudGVyXG4gICAgLmFwcGVuZCgnbGluZScpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc2VsZWN0ZWQteWVhci1saW5lJylcbiAgICAgIC5hdHRyKCd5MScsIDApXG4gICAgLm1lcmdlKGcuc2VsZWN0KCcuc2VsZWN0ZWQteWVhci1saW5lJykpXG4gICAgICAuYXR0cigneDEnLCB4U2NhbGUocGFyc2VZZWFyKGNob29zZS5Bbm5vKSkpXG4gICAgICAuYXR0cigneDInLCB4U2NhbGUocGFyc2VZZWFyKGNob29zZS5Bbm5vKSkpXG4gICAgICAuYXR0cigneTInLCBpbm5lckhlaWdodCk7XG4gIFx0XHRcbiAgZ0VudGVyXG4gICAgLmFwcGVuZCgncmVjdCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbW91c2UtaW50ZXJjZXB0b3InKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnbm9uZScpXG4gIFx0XHQuc3R5bGUoJ2N1cnNvcicsJ3BvaW50ZXInKVxuICAgICAgLmF0dHIoJ3BvaW50ZXItZXZlbnRzJywgJ2FsbCcpXG4gIFx0XHQuYXR0cigncG9pbnRlci1ldmVudHMnLCAnYWxsJylcbiAgICAubWVyZ2UoZy5zZWxlY3QoJy5tb3VzZS1pbnRlcmNlcHRvcicpKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgaW5uZXJXaWR0aClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBpbm5lckhlaWdodClcbiAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgeCA9IG1vdXNlKHRoaXMpWzBdO1xuICAgICAgICBjb25zdCBob3ZlcmVkRGF0ZSA9IHhTY2FsZS5pbnZlcnQoeCsxMCk7XG4gICAgICAgIG9uWWVhckNsaWNrZWQoU3RyaW5nKGhvdmVyZWREYXRlLmdldEZ1bGxZZWFyKCkpKTtcbiAgICAgIH0pO1xuXG59OyIsIlxuZXhwb3J0IGNvbnN0IGRyb3Bkb3duTWVudSA9IChzZWxlY3Rpb24sIHByb3BzKSA9PiB7XG4gIGNvbnN0IHtcbiAgICBpZCxcbiAgICBvcHRpb25zLFxuICAgIG9uT3B0aW9uQ2xpY2tlZCxcbiAgICBzZWxlY3RlZE9wdGlvbixcbiAgICBmaXJzdEVsLFxuICAgIGFzY1xuICB9ID0gcHJvcHM7XG4gIFxuICBsZXQgd3JhcCA9IHNlbGVjdGlvbi5zZWxlY3RBbGwoXCIjXCIraWQpLmRhdGEoW251bGxdKTtcbiAgd3JhcCA9IHdyYXAuZW50ZXIoKS5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cihcImlkXCIsIGlkKVxuICBcdFx0LmF0dHIoXCJjbGFzc1wiLCBcIndyYXAtc2VsZWN0XCIpXG4gIFx0Lm1lcmdlKHdyYXApXG4gIFxuICBsZXQgc2VsZWN0ID0gd3JhcC5zZWxlY3RBbGwoJ3NlbGVjdCcpLmRhdGEoW251bGxdKTtcbiAgc2VsZWN0ID0gc2VsZWN0LmVudGVyKCkuYXBwZW5kKCdzZWxlY3QnKVxuICAgIC5tZXJnZShzZWxlY3QpXG4gICAgICAub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBvbk9wdGlvbkNsaWNrZWQodGhpcy52YWx1ZSk7XG4gICAgICB9KTtcbiAgXG4gIGNvbnN0IHNtYXJ0U29ydCA9IGZ1bmN0aW9uKGVsZW0sIGV4ZXB0LCBhc2Mpe1xuICAgIGxldCB0bXA7XG4gICAgaWYgKGV4ZXB0KXtcbiAgICAgIGxldCBwaXZvdCA9IGVsZW0uZmluZChkPT5kID09PSBleGVwdCk7XG4gICAgICB0bXAgPSBlbGVtLmZpbHRlcihkPT5kICE9PSBleGVwdCk7XG4gICAgICB0bXAgPSB0bXAuc29ydCgpO1xuICAgICAgYXNjID09PSBmYWxzZSA/IHRtcC5yZXZlcnNlKCkgOiBudWxsO1xuICAgICAgdG1wLnVuc2hpZnQocGl2b3QpO1xuICAgIH1lbHNle1xuICAgIFx0dG1wID0gZWxlbS5zb3J0KCk7XG4gICAgICBhc2MgPT09IGZhbHNlID8gdG1wLnJldmVyc2UoKSA6IG51bGw7XG4gICAgfVxuICAgIHJldHVybiAodG1wKTtcbiAgfVxuICBcbiAgY29uc3Qgb3B0aW9uID0gc2VsZWN0LnNlbGVjdEFsbCgnb3B0aW9uJykuZGF0YShzbWFydFNvcnQob3B0aW9ucyxmaXJzdEVsLGFzYykpO1xuICBvcHRpb24uZW50ZXIoKS5hcHBlbmQoJ29wdGlvbicpXG4gICAgLm1lcmdlKG9wdGlvbilcbiAgICAgIC5hdHRyKCd2YWx1ZScsIGQgPT4gZClcbiAgICAgIC5wcm9wZXJ0eSgnc2VsZWN0ZWQnLCBkID0+IGQgPT09IHNlbGVjdGVkT3B0aW9uKVxuICAgICAgLnRleHQoZCA9PiBkKTtcbn07IiwiaW1wb3J0IHtcbiAgc2VsZWN0LFxuICBtYXAsXG59IGZyb20gJ2QzJztcblxuaW1wb3J0IHsgZHJvcGRvd25NZW51IH0gZnJvbSAnLi9kcm9wZG93bk1lbnUnO1xuXG5mdW5jdGlvbiBudW1iZXJXaXRoUG9pbnQoeCkge1xuICAgIHJldHVybiB4LnRvU3RyaW5nKCkucmVwbGFjZSgvXFxCKD89KFxcZHszfSkrKD8hXFxkKSkvZywgXCIuXCIpO1xufVxuXG5leHBvcnQgY29uc3QgY29udHJvbFBhbmVsID0gKHNlbGVjdGlvbiwgcHJvcHMpID0+IHtcbiBcdGNvbnN0IHtcbiAgICB2YWxEZWZhdWx0LFxuICAgIGNvbG9yU2NhbGVyLFxuICAgIG9uUGxhY2VDbGlja2VkLFxuICAgIG9uRGVncmVlQ2xpY2tlZCxcbiAgICBvblllYXJDbGlja2VkLFxuICAgIGZpbHRlckZ1bixcbiAgICBjaG9vc2UsXG4gICAgZGF0YVxuICB9ID0gcHJvcHM7XG4gIFxuICAvL2Rpc2Vnbm8gcGFubmVsbG8gZGkgY29udHJvbGxvXG4gIGNvbnN0IGN0cmxQID0gc2VsZWN0aW9uLnNlbGVjdEFsbChcIiNjdHJsLXBhbmVsXCIpXG4gICAgLmRhdGEoW251bGxdKTtcbiAgY29uc3QgY3RybEVudGVyID0gY3RybFBcdFx0XHRcdFx0XG4gICAgXHQuZW50ZXIoKS5hcHBlbmQoXCJkaXZcIilcdFx0XG4gICAgXHRcdC5hdHRyKFwiaWRcIiwgXCJjdHJsLXBhbmVsXCIpXG4gIFx0Y3RybEVudGVyXG4gICAgXHQubWVyZ2UoY3RybFApXG5cbiAgLy9kaXNlZ25vIGhlYWQgZGVsIHBhbm5lbGxvXG4gIGNvbnN0IGhlYWRQID0gY3RybFAuc2VsZWN0KFwiI2hlYWQtcGFuZWxcIilcbiAgY29uc3QgaGVhZEVudGVyID0gY3RybEVudGVyXG4gIFx0LmFwcGVuZChcImRpdlwiKVxuICBcdFx0LmF0dHIoXCJpZFwiLCBcImhlYWQtcGFuZWxcIik7XG4gIFx0aGVhZFBcbiAgICBcdC5tZXJnZShoZWFkRW50ZXIpXG4gIFx0XHRcdC5zdHlsZShcImNvbG9yXCIsIGNvbG9yU2NhbGVyKGNob29zZS5HcmFkbykpXG4gIFx0XHRcdC50ZXh0KFwiU2N1b2xhIEJhc2lsaWNhdGFcIik7XG4gIFxuICAvL2Rpc2Vnbm8gYm9keSBkZWwgcGFubmVsbG9cbiAgY29uc3QgYm9keVAgPSBjdHJsUC5zZWxlY3QoXCIjYm9keS1wYW5lbFwiKVxuICBjb25zdCBib2R5RW50ZXIgPSBjdHJsRW50ZXJcbiAgXHQuYXBwZW5kKFwiZGl2XCIpXG4gIFx0XHQuYXR0cihcImlkXCIsIFwiYm9keS1wYW5lbFwiKTtcbiAgXHRib2R5UFxuICAgIFx0Lm1lcmdlKGJvZHlFbnRlcilcbiAgICAgIC5jYWxsKGRyb3Bkb3duTWVudSwge1xuICAgICAgXHRpZDpcInBsYWNlXCIsXG4gICAgICAgIG9wdGlvbnM6IG1hcChkYXRhLGQ9PmQuTHVvZ28pLmtleXMoKSxcbiAgICAgICAgb25PcHRpb25DbGlja2VkOiBvblBsYWNlQ2xpY2tlZCxcbiAgICAgICAgc2VsZWN0ZWRPcHRpb246IGNob29zZS5MdW9nbyxcbiAgICAgIFx0Zmlyc3RFbDp2YWxEZWZhdWx0Lkx1b2dvLFxuICAgICAgXHRhc2M6IHRydWVcbiAgICAgIH0pXG4gIFx0XHQuY2FsbChkcm9wZG93bk1lbnUsIHtcbiAgICAgIFx0aWQ6XCJkZWdyZWVcIixcbiAgICAgICAgb3B0aW9uczogbWFwKGRhdGEsKGQ9PmQuR3JhZG8pKS5rZXlzKCksXG4gICAgICAgIG9uT3B0aW9uQ2xpY2tlZDogb25EZWdyZWVDbGlja2VkLFxuICAgICAgICBzZWxlY3RlZE9wdGlvbjogY2hvb3NlLkdyYWRvLFxuICAgICAgXHRmaXJzdEVsOnZhbERlZmF1bHQuR3JhZG8sXG4gICAgICBcdGFzYzogdHJ1ZVxuICAgICAgfSlcbiAgXHRcdC5jYWxsKGRyb3Bkb3duTWVudSwge1xuICAgICAgXHRpZDpcInllYXJcIixcbiAgICAgICAgb3B0aW9uczogbWFwKGRhdGEsKGQ9PmQuQW5ubykpLmtleXMoKSxcbiAgICAgICAgb25PcHRpb25DbGlja2VkOiBvblllYXJDbGlja2VkLFxuICAgICAgICBzZWxlY3RlZE9wdGlvbjogY2hvb3NlLkFubm8sXG4gICAgICBcdGZpc3J0RWw6IG51bGwsXG4gICAgICBcdGFzYzogZmFsc2VcbiAgICAgIH0pO1xuICBcbiAgLy9kaXNlZ25vIGxhYmVsIGluZm9ybWF0aXZlXG4gIGNvbnN0IGxhYmVsUCA9IGJvZHlQLnNlbGVjdChcIi53cmFwLWxhYmVsXCIpO1xuICBjb25zdCBsYWJlbEVudGVyID0gYm9keUVudGVyXG4gIFx0LmFwcGVuZChcImRpdlwiKVxuICBcdFx0LmF0dHIoXCJjbGFzc1wiLCBcIndyYXAtbGFiZWxcIik7XG4gIFx0bGFiZWxQXG4gICAgXHQubWVyZ2UoYm9keUVudGVyKTtcbiAgXG4gIGxldCBkYXRhU2VsZWN0ZWQgPSBkYXRhLmZpbHRlcihkPT5maWx0ZXJGdW4oZCxjaG9vc2UuTHVvZ28sY2hvb3NlLkdyYWRvLGNob29zZS5Bbm5vKSk7XG4gIGxldCBQb3AgPSBkYXRhU2VsZWN0ZWQubWFwKGQ9PmQuUG9wb2xhemlvbmUpO1xuICBsZXQgQ2xzID0gZGF0YVNlbGVjdGVkLm1hcChkPT5kLkNsYXNzaSk7XG4gIGxldCBBdmcgPSBNYXRoLnJvdW5kKFBvcC9DbHMpO1xuICAgICAgXG4gIGNvbnN0IGwwID0gbGFiZWxQLnNlbGVjdChcIiNsYWJlbDBcIik7XG4gIGNvbnN0IGwwRW50ZXIgPSBsYWJlbEVudGVyXG4gIFx0LmFwcGVuZChcImxhYmVsXCIpXG4gIFx0XHQuYXR0cihcImlkXCIsIFwibGFiZWwwXCIpXG4gIFx0bDBcbiAgICBcdC5tZXJnZShsMEVudGVyKVxuICBcdFx0XHQudGV4dChcIkFsdW5uaSByZWdpc3RyYXRpOiBcIilcbiAgXHRcdFx0LmFwcGVuZChcInNwYW5cIilcbiAgXHRcdFx0LnRleHQobnVtYmVyV2l0aFBvaW50KFBvcCkpO1xuICBcbiAgY29uc3QgbDEgPSBsYWJlbFAuc2VsZWN0KFwiI2xhYmVsMVwiKTtcbiAgY29uc3QgbDFFbnRlciA9IGxhYmVsRW50ZXJcbiAgXHQuYXBwZW5kKFwibGFiZWxcIilcbiAgXHRcdC5hdHRyKFwiaWRcIiwgXCJsYWJlbDFcIilcbiAgXHRsMVxuICAgIFx0Lm1lcmdlKGwxRW50ZXIpXG4gIFx0XHRcdC50ZXh0KFwiQ2xhc3NpIHJlZ2lzdHJhdGU6IFwiKVxuICBcdFx0XHQuYXBwZW5kKFwic3BhblwiKVxuICBcdFx0XHQudGV4dChudW1iZXJXaXRoUG9pbnQoQ2xzKSk7XG4gIFxuICBjb25zdCBsMiA9IGxhYmVsUC5zZWxlY3QoXCIjbGFiZWwyXCIpO1xuICBjb25zdCBsMkVudGVyID0gbGFiZWxFbnRlclxuICBcdC5hcHBlbmQoXCJsYWJlbFwiKVxuICBcdFx0LmF0dHIoXCJpZFwiLCBcImxhYmVsMlwiKVxuICBcdGwyXG4gICAgXHQubWVyZ2UobDJFbnRlcilcbiAgXHRcdFx0LnRleHQoXCJBbHVubmkgcGVyIGNsYXNzZTogXCIpXG4gIFx0XHRcdC5hcHBlbmQoXCJzcGFuXCIpXG4gIFx0XHRcdC50ZXh0KG51bWJlcldpdGhQb2ludChBdmcgPyBBdmcgOiAwKSk7XG4gIFxufSIsImltcG9ydCB7XG4gIHNlbGVjdCxcbiAgeG1sLFxuICBqc29uLFxuICBzY2FsZU9yZGluYWwsXG4gIG1hcFxufSBmcm9tICdkMyc7XG5cbmltcG9ydCB7IGxvYWRBbmRQcm9jRGF0YSB9IGZyb20gJy4vbG9hZEFuZFByb2NEYXRhJztcbmltcG9ydCB7IG1hcFBsb3QgfSBmcm9tICcuL21hcFBsb3QnO1xuaW1wb3J0IHsgcGllUGxvdCB9IGZyb20gJy4vcGllUGxvdCc7XG5pbXBvcnQgeyBsaW5lUGxvdCB9IGZyb20gJy4vbGluZVBsb3QnO1xuaW1wb3J0IHsgY29udHJvbFBhbmVsIH0gZnJvbSAnLi9jb250cm9sUGFuZWwnO1xuXG4vL2luaXppYWxpenphemlvbmUgZSB2YWxvcmkgZGkgZGVmYXVsdFxuY29uc3QgdmFsRGVmYXVsdCA9IHtcdFxuICBcdFx0XHRcdFx0XHRcdEx1b2dvOiBcIlR1dHRhIGxhIHJlZ2lvbmVcIixcbiAgICAgICAgICAgICAgXHRHcmFkbzogXCJUdXR0aSBpIGdyYWRpXCIsXG4gICAgICAgICAgICAgIFx0QW5ubzogMjAyMVxuXHRcdFx0XHRcdCAgfTtcblxubGV0IGNob29zZSA9IHsuLi52YWxEZWZhdWx0fTtcbmxldCBkYXRhO1xuXG4vL2Z1bnppb25pIGRpIHNlcnZpemlvXG5jb25zdCBuYW1lX2Zvcm1hdCA9IChuYW1lKSA9PiB7XG5cdFx0cmV0dXJuIChuYW1lLnJlcGxhY2VBbGwoXCJfeDI3X1wiLFwiJ1wiKS5yZXBsYWNlQWxsKFwiX1wiLFwiIFwiKSlcbn07XG5cbmNvbnN0IG9uUGxhY2VDbGlja2VkID0gZCA9PiB7XG4gIGNob29zZS5MdW9nbyA9IGQ7XG4gIHJlbmRlcigpO1xufTtcbmNvbnN0IG9uRGVncmVlQ2xpY2tlZCA9IGQgPT4ge1xuICBjaG9vc2UuR3JhZG8gPSBkO1xuICByZW5kZXIoKTtcbn07XG5jb25zdCBvblllYXJDbGlja2VkID0gZCA9PiB7XG4gIGNob29zZS5Bbm5vID0gZDtcbiAgcmVuZGVyKCk7XG59O1xuXG5sZXQgc2VsZWN0ZWRZZWFyID0gdmFsRGVmYXVsdC5Bbm5vO1xuY29uc3Qgc2V0U2VsZWN0ZWRZZWFyID0geWVhciA9PiB7XG4gIHNlbGVjdGVkWWVhciA9IHllYXI7XG4gIHJlbmRlcigpO1xufTtcblxuY29uc3QgZmlsdGVyRnVuID0gZnVuY3Rpb24oZCxsdW9nbyxncmFkbyxhbm5vKXtcbiAgaWYgXHQoZC5MdW9nbz09bHVvZ28gJiYgZC5HcmFkbz09Z3JhZG8gJiYgZC5Bbm5vPT1hbm5vKSByZXR1cm4gdHJ1ZVxuICBlbHNlIHJldHVybiBmYWxzZVxufVxuXG5jb25zdCBjb2xsZWN0RGF0YSA9IGZ1bmN0aW9uKGxvYWRlZERhdGEpe1xuICBkYXRhID0gbG9hZGVkRGF0YTtcbiAgcmVuZGVyKCk7XG59XG5cbi8vY2FyaWNhbWVudG8gdW5pY28gZGVsbGEgbWFwcGFcbnhtbChcIm1hcHBhLnN2Z1wiKS50aGVuKGQgPT4ge1xuICAgIHNlbGVjdChcImJvZHlcIikubm9kZSgpXG4gICAgICAuYXBwZW5kKGQuZG9jdW1lbnRFbGVtZW50KTtcbiAgXHRyZW5kZXIoKTtcbn0pO1xuXG4vL2Z1bnppb25lIGRpIHJlbmRlclxuY29uc3QgcmVuZGVyID0gKCkgPT4ge1xuICBcbiAgLy9tYXBwYSBjb2xvcmlcblx0Y29uc3QgY29sb3JTY2FsZXIgPSBzY2FsZU9yZGluYWwoKTtcblx0Y29sb3JTY2FsZXJcblx0XHQuZG9tYWluKG1hcChkYXRhLChkPT5kLkdyYWRvKSkua2V5cygpKSBcbiAgXHQucmFuZ2UoW1wiI2MxYjJhYmZmXCIsXCIjOTIzNzRkZmZcIiwgXCIjOGM1MzgzZmZcIiwgXCIjNGE1ODk5ZmZcIiwgXCIjNTU5Y2FkZmZcIl0pO1xuICBcdFxuICAvL3Bhbm5lbGxvIGRpIGNvbnRyb2xsbyBsYXRlcmFsZVxuICBzZWxlY3QoXCJib2R5XCIpLmNhbGwoY29udHJvbFBhbmVsLCB7XG4gICAgdmFsRGVmYXVsdDogdmFsRGVmYXVsdCxcbiAgICBjb2xvclNjYWxlcjogY29sb3JTY2FsZXIsXG4gICAgb25QbGFjZUNsaWNrZWQ6IG9uUGxhY2VDbGlja2VkLFxuICAgIG9uRGVncmVlQ2xpY2tlZDogb25EZWdyZWVDbGlja2VkLFxuICAgIG9uWWVhckNsaWNrZWQ6IG9uWWVhckNsaWNrZWQsXG4gICAgZmlsdGVyRnVuOiBmaWx0ZXJGdW4sXG4gICAgY2hvb3NlOiBjaG9vc2UsXG4gICAgZGF0YTogZGF0YVxuICB9KTtcbiAgXG4gIC8vbWFwcGFcbiAgc2VsZWN0KFwiYm9keVwiKS5jYWxsKG1hcFBsb3QsIHtcbiAgICB2YWxEZWZhdWx0OiB2YWxEZWZhdWx0LFxuICAgIG5hbWVfZm9ybWF0OiBuYW1lX2Zvcm1hdCxcbiAgICBjb2xvclNjYWxlcjogY29sb3JTY2FsZXIsXG4gICAgb25QbGFjZUNsaWNrZWQ6IG9uUGxhY2VDbGlja2VkLFxuICAgIGZpbHRlckZ1bjogZmlsdGVyRnVuLFxuICAgIGNob29zZTogY2hvb3NlLFxuICAgIGRhdGE6IGRhdGFcbiAgfSk7XG4gIFxuICAvL3RvcnRlXG4gIHNlbGVjdChcImJvZHlcIikuY2FsbChwaWVQbG90LCB7XG4gICAgdmFsRGVmYXVsdDogdmFsRGVmYXVsdCxcbiAgICBuYW1lX2Zvcm1hdDogbmFtZV9mb3JtYXQsXG4gICAgY29sb3JTY2FsZXI6IGNvbG9yU2NhbGVyLFxuICAgIG9uRGVncmVlQ2xpY2tlZDogb25EZWdyZWVDbGlja2VkLFxuICAgIGZpbHRlckZ1bjogZmlsdGVyRnVuLFxuICAgIGNob29zZTogY2hvb3NlLFxuICAgIGRhdGE6IGRhdGFcbiAgfSk7XG4gIFxuICAvL2FuZGFtZW50b1xuICBzZWxlY3QoXCJib2R5XCIpLmNhbGwobGluZVBsb3QsIHtcbiAgICB2YWxEZWZhdWx0OiB2YWxEZWZhdWx0LFxuICAgIG5hbWVfZm9ybWF0OiBuYW1lX2Zvcm1hdCxcbiAgICBjb2xvclNjYWxlcjogY29sb3JTY2FsZXIsXG4gICAgb25ZZWFyQ2xpY2tlZDogb25ZZWFyQ2xpY2tlZCxcbiAgICBmaWx0ZXJGdW46IGZpbHRlckZ1bixcbiAgICBjaG9vc2U6IGNob29zZSxcbiAgICBsb2FkZWREYXRhOiBkYXRhXG4gIH0pO1xuXG59O1xuXG4vL2NhcmljYW1lbnRvIGUgcHJvY2Vzc2FtZW50byBkYXRpXG5qc29uKCdkYXRhc2V0Lmpzb24nKVxuICAudGhlbihkID0+IHtcbiAgICAgIGRhdGEgPSBsb2FkQW5kUHJvY0RhdGEoe1xuICAgICAgdmFsRGVmYXVsdDp2YWxEZWZhdWx0LFxuICAgICAgbmFtZV9mb3JtYXQ6IG5hbWVfZm9ybWF0LFxuICAgICAgZmlsdGVyRnVuOiBmaWx0ZXJGdW4sXG4gICAgICBsb2FkZWREYXRhOiBkXG4gICAgfSk7XG4gIHJlbmRlcigpO1xufSk7Il0sIm5hbWVzIjpbIm1hcCIsInNlbGVjdCIsInNjYWxlUG93IiwiZXh0ZW50IiwibmVzdCIsInBpZSIsImVudHJpZXMiLCJhcmMiLCJ0aW1lUGFyc2UiLCJzY2FsZVRpbWUiLCJzY2FsZUxpbmVhciIsImF4aXNCb3R0b20iLCJ0aW1lRm9ybWF0IiwiZm9ybWF0IiwiYXhpc0xlZnQiLCJsaW5lIiwiY3VydmVCYXNpcyIsIm1vdXNlIiwieG1sIiwi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