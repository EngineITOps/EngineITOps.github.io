var a_tags = document.querySelectorAll('a');

for(let a of a_tags) {
    if (a.host !== window.location.host) a.target = '_blank';
}