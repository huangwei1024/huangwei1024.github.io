{% if theme.cdn.link %}
<script type="text/javascript">

$(document).ready(function () {
    $("img").each(function(){
	var src = $(this).attr("src");
	if (src.indexOf('/static') == 0) {
		$(this).attr("src", "{{ theme.cdn.link }}" + src);
		//alert("222 " + $(this).attr("src"));
	}
  });  
})


</script>
{% endif %}
