
export const dropdownMenu = (selection, props) => {
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
  	.merge(wrap)
  
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
    }else{
    	tmp = elem.sort();
      asc === false ? tmp.reverse() : null;
    }
    return (tmp);
  }
  
  const option = select.selectAll('option').data(smartSort(options,firstEl,asc));
  option.enter().append('option')
    .merge(option)
      .attr('value', d => d)
      .property('selected', d => d === selectedOption)
      .text(d => d);
};