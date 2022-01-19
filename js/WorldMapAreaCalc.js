function checkCoords( array1, array2, element, type ) {
    let check;
    
    if (type) {
      check = (array1[element] < array2[element]) ? array1 : array2;
    } else {
      check = (array1[element] > array2[element]) ? array1 : array2;
    }
    
    return check
}
  
function generateCoords() {
    let a = [ +document.getElementById("p1width").value, +document.getElementById("p1height").value, +document.getElementById("y1coord").value, +document.getElementById("x1coord").value ]
    
    let b = [ +document.getElementById("p2width").value, +document.getElementById("p2height").value, +document.getElementById("y2coord").value, +document.getElementById("x2coord").value ]
    
    let PXwidth = Math.abs(b[0] - a[0]), 
        PXheight = Math.abs(b[1] - a[1]);
    
    let CoordWidth = Math.abs(b[2] - a[2]), 
        CoordHeight = Math.abs(b[3] - a[3]);
    
    let x1 = checkCoords(a, b, 0, true)[2] + ((Math.min(a[0], b[0]) * CoordWidth) / PXwidth), 
        x2 = checkCoords(a, b, 0, false)[2] - (((1002 - Math.max(a[0], b[0])) * CoordWidth) / PXwidth);

    let y1 = checkCoords(a, b, 1, true)[3] + ((Math.min(a[1], b[1]) * CoordHeight) / PXheight), 
        y2 = checkCoords(a, b, 1, false)[3] - (((668 - Math.max(a[1], b[1])) * CoordHeight) / PXheight);

    document.getElementById("genout").value = parseFloat(x1).toFixed(6) + "," + parseFloat(x2).toFixed(6) + "," + parseFloat(y1).toFixed(6) + "," + parseFloat(y2).toFixed(6);

}