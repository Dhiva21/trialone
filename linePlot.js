import {
  select,
  map,
  svg,
  scaleOrdinal,
  extent,
  entries,
  scaleLinear,
  scaleTime,
  axisLeft,
  axisBottom,
  line,
  curveBasis,
  nest,
  descending,
  format,
  mouse,
  timeParse,
  timeFormat
} from 'd3';

export const linePlot = (selection, props) => {
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
  const parseYear = timeParse("%Y");
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
  const nTicksX = map(data,(d=>d.Anno)).keys().length
  
  //groupby
  const nested = nest()
    .key(d => d.Grado)
    .entries(data);
  
  //disegna container svg
  const contP = selection.selectAll("#andamento")
    .data([null]);
  const contEnter = contP					
    	.enter().append("svg")		
    		.attr("id", "andamento")
  const cont = contEnter
    	.merge(contP)

  const xScale = scaleTime()
    .domain(extent(data, xValue))
    .range([0, innerWidth]);

  const yScale = scaleLinear()
    .domain(extent(data, yValue))
    .range([innerHeight, 0])
    .nice();
  
  const g = cont.selectAll('.containerL').data([null]);
  const gEnter = g.enter()
    .append('g')
      .attr('class', 'containerL');
  gEnter.merge(g)
    .attr('transform', `translate(50,50)`);
  
  const xAxis = axisBottom(xScale)
  	.ticks(nTicksX)
    .tickSize(-innerHeight)
  	.tickFormat(timeFormat("%Y"))
    .tickPadding(15);
  
  const yAxisTickFormat = number =>
    format('.2s')(number)
      .replace('.0', '')

  const yAxis = axisLeft(yScale)
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
  const lineGenerator = line()
    .x(d => xScale(xValue(d)))
    .y(d => yScale(yValue(d)))
    .curve(curveBasis);
  
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
  		.attr('stroke-linecap', 'round')
	
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
        const x = mouse(this)[0];
        const hoveredDate = xScale.invert(x+10);
        onYearClicked(String(hoveredDate.getFullYear()));
      });

};