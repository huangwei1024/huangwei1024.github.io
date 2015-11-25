{% extends '_layout.swig' %}
{% import '_macro/sidebar.swig' as sidebar_template %}

{% set post_class = 'post post-type-' + post.type | default('normal') %}
{% set post_class = post_class + ' ' + post_extra_class | default('') %}
{% if post.sticky > 0 %}
  {% set post_class = post_class + ' ' + 'post-sticky' %}
{% endif %}

{% block content %}

  <div id="posts" class="posts-expand">
    <article class="{{ post_class }}" itemscope itemtype="http://schema.org/Article">
    <span itemprop="articleBody">{{ page.content }}</span>
    </article>
  </div>

{% endblock %}

{% block sidebar %}
  {{ sidebar_template.render(false) }}
{% endblock %}


{% block script_extra %}
  {% include '_scripts/pages/post-details.swig' %}
{% endblock %}
