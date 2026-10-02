// Both galleries only receive thumbnails inspected by the cached gallery API.
(() => {
  window.selectProjectThumbnails = async (projects,count) => projects.filter(project=>project.thumbnailChecked===true).slice(0,count);
})();
