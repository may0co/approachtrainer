<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Approach Trip Trainer</title>
<meta name="theme-color" content="#171C23">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<link rel="icon" href="icons/icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Approach">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
/*CSS*/
</style>
</head>
<body>
<header class="top">
  <div class="top-in">
    <a class="brand" href="#home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20l6-11 3 5 3-8 6 14"/></svg>Approach</a>
    <a class="ctx" id="ctx" href="#account" style="color:inherit">Data</a>
  </div>
</header>
<nav class="tabs" aria-label="Sections"><div class="tabs-in" id="tabs">
  <a href="#home" data-v="home"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/></svg>Today</a>
  <a href="#plan" data-v="plan"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>Plan</a>
  <a href="#log" data-v="log"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"/><path d="M3.5 6l.8.8L6 5.2M3.5 12l.8.8L6 11.2M3.5 18l.8.8L6 17.2"/></svg>Log</a>
  <a href="#progress" data-v="progress"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V4M4 20h16"/><path d="M7.5 15l4-4.5 3 2.5 5-6"/></svg>Progress</a>
  <a href="#areas" data-v="areas"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 19.5l6.5-11 3.5 5.5 2.5-4 6.5 9.5z"/></svg>Areas</a>
</div></nav>
<main class="wrap" id="app"></main>
<button type="button" class="rest" id="rest" data-act="rest-stop" hidden></button>
<div class="toast" id="toast" role="status" hidden></div>
<div id="tip" hidden></div>
<script src="config.js"></script>
<script>
(function () {
  'use strict';
  var URL = { gear: 'https://claude.ai/artifact/BA7qVxA4KDh4b6AWGLnwM3', strength: 'https://claude.ai/artifact/EQgtmvRXnj1HB19Q4zLqHH', kilter: 'https://claude.ai/artifact/7axgeKW4cwXZvauVXNsi6Q', camp: 'https://claude.ai/artifact/JqafmBEjxxkAmyvCRUAQRE' };
  var CAM_COLOR = { '.3': '#2F6DB5', '.4': '#8A8F94', '.5': '#6B4C9A', '.75': '#3E8E4F', '1': '#C8352B', '2': '#D9A520', '3': '#2F6DB5', '4': '#B9BDC2' };
/*JS*/
})();
</script>
</body>
</html>
