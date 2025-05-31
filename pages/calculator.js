export default async function ({ template }) {
    document.title = 'WorldMapArea Calculator | Trimitor';
    return Mustache.render(template, {});
}

export function after() {
    $('.calculate').on('click', generate);
}

function check(array1, array2, index, isMin) {
    return (isMin ? array1[index] < array2[index] : array1[index] > array2[index]) ? array1 : array2;
}

function generate() {
    const getVal = id => +$(`#${id}`).val();

    const a = [getVal("p1width"), getVal("p1height"), getVal("y1coord"), getVal("x1coord")];
    const b = [getVal("p2width"), getVal("p2height"), getVal("y2coord"), getVal("x2coord")];

    const PXwidth = Math.abs(b[0] - a[0]);
    const PXheight = Math.abs(b[1] - a[1]);

    const CoordWidth = Math.abs(b[2] - a[2]);
    const CoordHeight = Math.abs(b[3] - a[3]);

    const x1 = check(a, b, 0, true)[2] + ((Math.min(a[0], b[0]) * CoordWidth) / PXwidth);
    const x2 = check(a, b, 0, false)[2] - (((1002 - Math.max(a[0], b[0])) * CoordWidth) / PXwidth);

    const y1 = check(a, b, 1, true)[3] + ((Math.min(a[1], b[1]) * CoordHeight) / PXheight);
    const y2 = check(a, b, 1, false)[3] - (((668 - Math.max(a[1], b[1])) * CoordHeight) / PXheight);

    $("#genout").val(`${x1.toFixed(6)},${x2.toFixed(6)},${y1.toFixed(6)},${y2.toFixed(6)}`);
}
