
(function(){
  const el = document.getElementById('last-updated');
  if(el) el.textContent = new Date().toLocaleString();
})();
