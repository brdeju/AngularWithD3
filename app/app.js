var app = angular.module("MainApp", []);

app.controller("chartsController", ["$scope", "$http", function ($scope, $http) {
    $scope.url = $scope.url || "zawod1";
    $scope.srWynagrodzenie = $scope.srWynagrodzenie || 3000;
    
    d3.select("select")
        .on("change", function () {
            // Najpierw D3 wykonuje funkcje w eventach a dopiero potem Angular przypisuje wartość do $scope,
            //  nie udało mi się znaleźć czemu D3 pierwszy wykonuje event update na wykresie 
            //  a dopiero potem angular przypisuje wartość do $scope.url.. stąd ta linijka
            $scope.url = d3.select(this).property("value");
            d3.select("bar-chart").on("update")();
        });
    d3.select("#srWynagrodzenie")
        // Jednak tutaj powyższego problemu nie ma..
        .on("change", function () {
            d3.select("bar-chart").on("update")();
            d3.select("multiple-bar-chart").on("update")();
        });
}]);

app.directive("barChart", ['Zawod', function (Zawod) {
    return{
        restrict: 'E',
        link: function (scope, elem) {

            var srWynagrodzenie = scope.srWynagrodzenie;

            draw(Zawod.getData(scope.url));
            // Event odświeżający wykres
            d3.select("bar-chart")
                    .on("update", function () {
                        chartRedraw();
                    });

            function chartRedraw() {
                srWynagrodzenie = scope.srWynagrodzenie;
                d3.select(elem[0]).selectAll("*").remove();
                console.log(scope.url);
                draw(Zawod.getData(scope.url));
            }
            function draw(data) {
                if(!data) {
                    alert('Brak danych');
                    return false;
                }
                var xScale = d3.scale.linear().domain([0, srWynagrodzenie]).range([0, 300]);
                var axis = d3.svg.axis().scale(xScale);

                var canvas = d3.select(elem[0])
                        .append("svg")
                        .attr("width", 500)
                        .attr("height", 500)
                        .append("g")
                        .attr("class", "myChart");

                var rect = canvas.selectAll("g")
                        .data(data)
                        .enter()
                        .append("g")
                        .attr("class", "bar");
                rect.append("rect")
                        .attr("width", 0)
                        .transition()
                        .duration(850)
                        .attr("width", function (d) {
                            return xScale(d.zawod * srWynagrodzenie)
                        })
                        .attr("height", 45)
                        .attr("y", function (d, i) {
                            return i * 50;
                        })
                        .attr("fill", "green")

                rect.append("text")
                        .attr("fill", "white")
                        .attr("y", function (d, i) {
                            return i * 50 + 25;
                        })
                        .text(function (d) {
                            return d.woj;
                        });
                canvas.append("g").attr("transform", "translate(0,200)").call(axis);
            }
        }
    };
}]);

app.directive("multipleBarChart", ['Zawod', function (Zawod) {
    return{
        restrict: 'E',
        link: function (scope, elem) {

            var srWynagrodzenie = scope.srWynagrodzenie;
            
            draw(Zawod.getData());
            // Event odświeżający wykres
            d3.select("multiple-bar-chart")
                    .on("update", function () {
                        chartRedraw();
                    });
            

            function chartRedraw() {
                srWynagrodzenie = scope.srWynagrodzenie;
                // usunięcie starego wykresu
                d3.select(elem[0]).selectAll("*").remove();
                // narysowanie nowego
                draw(Zawod.getData());
            }
            function draw(data) {
                
                var varNames = d3.keys(data);
                // Przygotowanie zestawu danych
                var dataset = {
                    labels: data[varNames[0]].map(function (d) {
                        return d.woj;
                    }),
                    series:[]
                };
                for(var key in data) {
                    dataset.series.push({
                        values: data[key].map(function (d) {
                            return d.zawod;
                        }),
                        label: key
                    });
                };
                
                var chartWidth       = 300,
                    barHeight        = 35,
                    groupHeight      = barHeight * dataset.series.length,
                    gapBetweenGroups = 10,
                    spaceForLabels   = 150,
                    spaceForLegend   = 150,
                    chartMargin      = 100,
                    seriesLen        = dataset.series[0].values.length;
            
                var data = [];
                for (var i=0; i<dataset.labels.length; i++) {
                    for (var j=0; j<dataset.series.length; j++) {
                        // Jeśli brak wartości dla województwa zostaje przypisana wartość 0
                        if(typeof dataset.series[j].values[i] === "undefined") { 
                            dataset.series[j].values[i] = 0;
                        }
                        data.push(Math.round(dataset.series[j].values[i] * srWynagrodzenie));
                    }
                }
                var chartHeight = barHeight * data.length + gapBetweenGroups * dataset.labels.length + chartMargin;
                // Kolory dla seri
                var colors = d3.scale.ordinal()
                    .range(["#008000", "#1F77B4", "#FF7F0E", "#F20EFF"]);  
                // Zakresy x oraz y
                var x = d3.scale.linear()
                    .domain([0, srWynagrodzenie])
                    .range([0, chartWidth]);
                var y = d3.scale.ordinal()
                    .domain(dataset.labels.reverse())
                    .rangeRoundBands([(groupHeight*seriesLen + gapBetweenGroups*(seriesLen+1)), 0], 0.05);
            
                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left");
                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");
                // Wykres
                var chart = d3.select(elem[0])
                    .append("svg")
                    .attr("width", spaceForLabels + chartWidth + spaceForLegend)
                    .attr("height", chartHeight);
                // Słupki
                var bar = chart.selectAll("g")
                    .data(data)
                    .enter().append("g")
                    .attr("transform", function(d, i) {
                        return "translate(120," + (i * barHeight + gapBetweenGroups * (Math.floor(i/dataset.series.length))) + ")";
                    });
                bar.append("rect")
                    .attr("fill", function(d,i) { return colors(i % dataset.series.length); })
                    .attr("class", "bar")
                    .attr("width", 0)
                    .transition()
                    .duration(1000)
                    .attr("width", x)
                    .attr("height", barHeight);
                bar.append("text")
                    .attr("x", function(d) { return 0; })
                    .attr("y", barHeight / 2)
                    .attr("fill", function(d) { return d>20?"white":"black"; })
                    .attr("dy", ".35em")
                    .text(function(d) { return d; });
                // Osie
                chart.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(110, " + -gapBetweenGroups/2 + ")")
                    .call(yAxis);
                chart.append("g").attr("transform", "translate(110,"+(groupHeight*seriesLen + gapBetweenGroups*seriesLen)+")").call(xAxis);
                // Legenda
                var legendRectSize = 18,
                    legendSpacing  = 4;

                var legend = chart.selectAll('.legend')
                    .data(dataset.series)
                    .enter()
                    .append('g')
                    .attr('transform', function (d, i) {
                        var height = legendRectSize + legendSpacing;
                        var offset = -gapBetweenGroups/2;
                        var horz = spaceForLabels + chartWidth + 40 - legendRectSize;
                        var vert = i * height - offset;
                        return 'translate(' + horz + ',' + vert + ')';
                    });
                legend.append('rect')
                    .attr('width', legendRectSize)
                    .attr('height', legendRectSize)
                    .style('fill', function (d, i) { return colors(i); })
                    .style('stroke', function (d, i) { return colors(i); });
                legend.append('text')
                    .attr('class', 'legend')
                    .attr('x', legendRectSize + legendSpacing)
                    .attr('y', legendRectSize - legendSpacing)
                    .text(function (d) { return d.label; });
            }
        }
    };
}]);


app.service('Zawod', ['$http', function ($http) {
    // Powinno być pobierane za pomocą $http z serwera,
    //  dodanie kolejnych zawodów bądź województw (w identycznym stylu) nie powoduje błędów 
    //  UWAGA: (pierwszy zawód MUSI zawierać wszystkie województwa)
    var data = {
        'zawod1': [
            {
                "woj": "mazowieckie",
                "zawod": 0.32
            },
            {
                "woj": "slaskie",
                "zawod": 0.14
            },
            {
                "woj": "malopolskie",
                "zawod": 0.33
            },
            {
                "woj": "opolskie",
                "zawod": 0.86
            }
        ],
        'zawod2': [
            {
                "woj": "mazowieckie",
                "zawod": 0.47
            },
            {
                "woj": "slaskie",
                "zawod": 0.64
            },
            {
                "woj": "malopolskie",
                "zawod": 0.27
            },
            {
                "woj": "opolskie",
                "zawod": 0.66
            }
        ]
    };
    // Funkcja zwracająca dane, jeśli podana nazwa zwraca dane dla tej nazwy, 
    //  jeśli brak - zwraca wszystkie dane dla wykresu zbiorczego
    this.getData = function (name) {
        if (typeof name === "undefined") {
            return data;
        }
        if(!(name in data)) {
            return false;
        }
        return data[name];
    };
}]);