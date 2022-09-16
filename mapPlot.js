import {
  select,
  xml,
  svg,
  scaleLinear,
  scalePow,
  extent
} from 'd3';

export const mapPlot = (selection, props) => {
  const {
    valDefault,
    name_format,
    colorScaler,
    onPlaceClicked,
    filterFun,
    choose,
    data
  } = props;
  
    const mappa = select('#mappa');
    const luoghi = mappa.selectAll('#mappa > *');
    
    //tutti luoghi filtrati
    const luoghiFiltrati = data
    												.filter(d=>d.Luogo!=valDefault.Luogo)
    												.filter(d=>filterFun(d,d.Luogo,choose.Grado,choose.Anno));
  
  	//scaler dell'opacità sulla Popolazione
    const opacityScaler = scalePow()
    .exponent(0.2)
    .domain(extent(luoghiFiltrati//.filter(d => !["Potenza","Matera"].includes(d.Luogo))
                   							 .map(d => d.Popolazione)
                  							 
                  )) 
    .range([1, 0.2]);
    
    luoghi.each(function() {
    	let luogo = select(this);

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
              select(this)
                .style("stroke", "#fff")
                .style("stroke-width", 3)
                .style("opacity", 1);
           })
          .on("mouseout", function (d) {
              select(this)
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
  
