(() => {
  const terminal=document.querySelector('.scratcher-terminal');
  if(!terminal) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  terminal.classList.add('terminal-ready');
  const observer=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)) {terminal.classList.add('terminal-typing');observer.disconnect();}
  },{threshold:.6});
  observer.observe(terminal);
})();
