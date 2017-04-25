var API_URL="tags.json"
 ,  REFRESH_INTERVAL=10
 ,  DATA_FIELD="popularity"
 ,  MAX_DATA=50;

var visualization = function(visualization){
    var data, layout, svg,  vis, w, h
        , fill = d3.scale.category20b();
    visualization.init = function(){
        w = window.innerWidth;
        h = window.innerHeight;
        layout = d3.layout.cloud()
                .timeInterval(Infinity)
                .size([w, h])
                .fontSize(function(d) {
                    return d.size
                })
                .text(function(d) {
                    return d.text;
                })
                .on("end", visualization.draw);
        if(svg){
            svg.remove();
        }
        svg = d3.select("#vis").append("svg")
        vis = svg.append("g");
        visualization.update();

        window.onresize = function(event) {
            visualization.update();
        };
    };

    visualization.draw = function(data, bounds) {
        scale = bounds ? Math.min(
                w / Math.abs(bounds[1].x - w / 2),
                w / Math.abs(bounds[0].x - w / 2),
                h / Math.abs(bounds[1].y - h / 2),
                h / Math.abs(bounds[0].y - h / 2)) / 2 : 1;

        var text = vis.selectAll("text")
                .data(data);
        text.transition()
                .duration(1000)
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                });
        text.enter().append("text")
                .attr("text-anchor", "middle")
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .style("font-size", function(d) {
                    return d.size + "px";
                })
                .style("opacity", 1e-6)
                .transition()
                .duration(1000)
                .style("opacity", 1);
        text.style("font-family", function(d) {
                    return d.font;
                })
                .style("fill", function(d) {
                    return fill(d.text.toLowerCase());
                })
                .text(function(d) {
                    return d.text;
                });
    };

    visualization.update = function() {
        w = window.innerWidth;
        h = window.innerHeight;
        svg.attr("width", w)
           .attr("height", h);
        vis.attr("transform", "translate(" + [w >> 1, h >> 1] + ")");
        layout.font('impact').spiral('archimedean');
        fontSize = d3.scale['log']().range([1, 100]);
        if (data.length){
            fontSize.domain([+data[data.length - 1].size || 1, +data[0].size]);
        }
        layout.stop().words(data).start();
    };

    visualization.fetchData = function(makeUpdate){
        $.getJSON(API_URL).fail( function(d, textStatus, error) {
            console.error("getJSON failed, status: " + textStatus + ", error: "+error)
        }).done(function(res){
            if(DATA_FIELD){
                data = res[DATA_FIELD];
            }else{
                data = res;
            }
            // sort data by weight
            data.sort(function(a,b){
               return b.weight - a.weight;
            });
            // slice to MAX_DATA
            data = data.slice(0, MAX_DATA)
            // patch data weights
            var tagSize = 15
             , tagValue = 0;
            data.forEach(function(val){
              if(tagValue != val.weight){
                tagValue = val.weight;
                tagSize = tagSize + 5
              }
              val.size = tagSize;
            });
            if(typeof makeUpdate === 'boolean' && makeUpdate){
                visualization.update();
            }else{
                visualization.init();
            }
        });
    };
    return visualization;
}(visualization || {});

$(visualization.fetchData);
setInterval(visualization.fetchData.bind(null, true), REFRESH_INTERVAL*1000)
