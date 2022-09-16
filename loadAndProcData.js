import {
  json,
  map
} from 'd3';

export const loadAndProcData = (props) => {
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
                            }else{
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
    (map(data,(d=>d.Anno)).keys()).forEach(function(y) {
    		(map(data,(d=>d.Grado)).keys()).forEach(function(g) {
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
    (map(data,(d=>d.Anno)).keys()).forEach(function(y) {
        (map(data,(d=>d.Luogo)).keys()).forEach(function(l) {
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
    (map(data,(d=>d.Anno)).keys()).forEach(function(y) {
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

}