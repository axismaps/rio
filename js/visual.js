function load_visual()
{
	clear_visual();
	if( visual[ year ] )
	{
		map.addLayer( visual[ year ] );
	}
	else
	{
		visual[ year ] = omnivore.geojson( server + "/visual/" + year )
			.on( 'ready', function()
			{
				_.each( this.getLayers(), draw_visual );
			})
			.addTo( map );
	}
}

function draw_visual( layer )
{
	layer.eachLayer( function( l )
	{
		if( l instanceof L.Marker )
		{
			l.setIcon( new L.icon({
				iconUrl : "img/viewpoint.png",
				iconSize : [ 25, 22 ],
				iconAnchor : [ 12, 11 ]
			}));

			l.layer = layer;

			l.on( "mouseover", function( e )
			{
				this.layer.bringToFront();
				show_cone.call(this);

				show_visual_details( this.layer.feature.properties, map.latLngToContainerPoint( e.latlng ) );
			});
			l.on( "mouseout", function( e )
			{
				hide_cone.call(this);
				$( ".visual_probe" ).remove();
			});

			// mousedown is used to help differentiate touch events from click events
			l.on( "mousedown", function(e)
			{
				l.selected = true;
			});
			l.on('click', function (e) {
				if( l.selected )
				{
					show_image( this.layer.feature.properties );
				}
				else
				{
					hide_all_cones();
					l.selected = true;
					this.layer.bringToFront();
					show_cone.call(this);
					map.once( "click", function ()
					{
						hide_cone.call(this);
					}.bind(this));
				}
			})
		}
		else
		{
			l.setStyle({
        clickable : false,
        fill : false,
				fillColor : "#000000",
				fillOpacity : 0,
				opacity : 0
			});
		}
	});
}

function show_cone()
{
	_.each( this.layer.getLayers(), function( l )
	{
		if( l instanceof L.Marker === false ) l.setStyle( { fillOpacity : 0.2, fill : true } );
	});
}

function hide_cone()
{
	_.each( this.layer.getLayers(), function( l )
	{
		if( l instanceof L.Marker === false )
		{
			this.selected = false;
			l.setStyle( { fillOpacity : 0, fill : false } );
		}
	}.bind(this));
}

function hide_all_cones()
{
	map.eachLayer( function ( layer )
	{
		if( layer.getLayers )
		{
			_.each( layer.getLayers(), function( l )
			{
				if( l instanceof L.Marker === false )
				{
					l.setStyle( { fillOpacity : 0, fill : false } );
				}
				else {
					l.selected = false;
				}
			});
		}
	});
}

function show_visual_details( properties, e )
{

	var probe = $( document.createElement( 'div' ) )
					.addClass( "visual_probe" )
					.html( "<b>" + properties.description + "</b><p>" + properties.creator + "</p><p>" + properties.repository + "</p><i>Click for details</i>" )
					.appendTo( $( ".wrapper" ) );

	$.ajax( "http://www.sscommons.org/openlibrary/secure/metadata/" + properties.id,{
		dataType : "json",
		success : function( json )
		{
      var verticalOffset = 100; //this is the header size
      var y = e.y + verticalOffset;
			probe.css({
				"background-image" : "url( http://www.sscommons.org/" + json.imageUrl + " )",
				"top" : y > $( window ).height() / 2 ? y - probe.outerHeight() - 20 : y + 20,
				"left" : e.x > $( window ).width() / 2 ? e.x - probe.outerWidth() - 20 : e.x + 20
			});
		}
	});
}

function show_image( data )
{
	$.getJSON( "http://www.sscommons.org/openlibrary/secure/imagefpx/" + data.id + "/7729935/5", function( json )
	{
		$.ajax( "http://www.sscommons.org/openlibrary/secure/metadata/" + data.id + "?_method=FpHtml",{
			dataType : "html",
			success : function( html )
			{
				var href = $( html ).find( "td" ).last().text().replace( /\s/gm, "" );
				var dim = scale_image( json[ 0 ].width, json[ 0 ].height );
				$.featherlight( '<img src="' + json[ 0 ].imageServer + json[ 0 ].imageUrl + "&&wid=" + dim.w + "&hei=" + dim.h + "&rgnn=0,0,1,1&cvt=JPEG" + '"><p><b>' + data.creator + '</b> - ' + data.date + '<br />' + data.description + '<br />' + data.repository + '</p><p><a href="http://www.sscommons.org/openlibrary/' + href + '&fs=true" target="_blank">View image on SharedShelf Commons</a></p>', { afterOpen : function(){ $( ".featherlight-content" ).width( dim.w ); } } );
			}
		});
	});
}

function clear_visual()
{
	if( map.hasLayer( visual[ year ] ) ) map.removeLayer( visual[ year ] );
}

function scale_image( width, height )
{
	if( $( window ).width() > mobileSize )
	{
		var maxWidth = Math.floor( $( window ).width() * 0.9 ) - 100,
		maxHeight = $( window ).height() - 250,
		ratio = 0;
	}
	else
	{
		maxWidth = $( window ).width() - 20;
		maxHeight = $( window ).height() - 150;
		ratio = 0;
	}

	if( width > maxWidth )
	{
		ratio = maxWidth / width;
		height = height * ratio;
		width = width * ratio;
	}

	if ( height > maxHeight )
	{
		ratio = maxHeight / height;
		width = width * ratio;
		height = height * ratio;
	}

	return { w : Math.round( width ), h : Math.round( height ) };
}
