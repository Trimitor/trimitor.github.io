export default async function ({ template }) {
    document.title = 'Missing Objectives Helper | WDM Collection';
    return Mustache.render(template, {});
}

export async function after() {
    const qpTemplate = await fetch('data/templates/qp').then(res => res.text());
    const qppTemplate = await fetch('data/templates/qpp').then(res => res.text());

    const qppTplLines = qppTemplate.trim().split(/\r?\n/);
    const qppDeleteTpl = qppTplLines[0];
    const qppInsertTpl = qppTplLines[1];

    const whData = (await getInfo('mohelper', 'getDungeons')).data.filter(d => d.quests !== null);

    const selectDungeons = document.getElementById('dungeons');
    const selectFloors = document.getElementById('floors');
    const selectQuests = document.getElementById('quests');
    const mapEl = document.getElementById('map');
    const clearBtn = document.getElementById('clearAll');
    const whLink = document.getElementById('wh-link');

    const addAreaBtn = document.getElementById('addArea');
    const areaSelect = document.getElementById('areaSelect');

    const qp = document.querySelector('textarea[name="qp"]');
    const qpp = document.querySelector('textarea[name="qpp"]');


    const createOptions = (items, getValue, getText) => {
        const fragment = document.createDocumentFragment();
        items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = getValue(item);
            opt.text = getText(item);
            fragment.appendChild(opt);
        });
        return fragment;
    };


    whData.sort((a, b) => a.areaName.localeCompare(b.areaName));
    selectDungeons.appendChild(
        createOptions(whData, a => a.id, a => a.areaName)
    );

    let currentArea = null;


    selectDungeons.addEventListener('change', () => {
        const areaId = parseInt(selectDungeons.value);
        currentArea = whData.find(a => a.id === areaId);
        if (!currentArea) return;

        const { floors = [], quests = [] } = currentArea;


        selectFloors.innerHTML = '';
        floors.sort((a, b) => a.floor - b.floor);
        selectFloors.appendChild(
            createOptions(floors, f => f.realFloor, f => `Floor ${f.floor}`)
        );


        selectQuests.innerHTML = '';
        quests.sort((a, b) => a.name.localeCompare(b.name));
        selectQuests.appendChild(
            createOptions(quests, q => q.id, q => `${q.name} (${q.id})`)
        );


        if (floors.length) {
            updateMap(floors[0]);
        }


        if (quests.length) {
            updateQuest(quests[0].id, quests[0].name + ` (${quests[0].id})`);
        }

        editor.clear();

        console.log(currentArea);
    });


    function updateMap(floor) {
        mapEl.style.backgroundImage = `url('/data/worldmap/${currentArea.mapName.toLowerCase()}.${floor.realFloor}.png')`;
    }

    function updateAreaSelect() {
        areaSelect.innerHTML = editor.areas
            .map((_, i) => `<option value="${i}" ${i === editor.activeAreaIndex ? "selected" : ""}>Area ${i + 1}</option>`)
            .join('');
    }


    function updateQuest(questid, questname) {
        whLink.innerHTML = '';
        if (!questid) return;
        whLink.innerHTML = `<a href="https://www.wowhead.com/wotlk/quest=${questid}" target="_blank" rel="noopener noreferrer">${questname}</a>`;
    }


    selectFloors.addEventListener('change', () => {
        if (!currentArea) return;
        const floor = currentArea.floors.find(f => f.realFloor === parseInt(selectFloors.value));
        if (floor) {
            updateMap(floor);
            editor.clear();
        }
    });


    selectQuests.addEventListener('change', () => {
        const questId = selectQuests.value;
        const questText = selectQuests.options[selectQuests.selectedIndex]?.text || '';
        updateQuest(questId, questText);
        editor.clear();
    });


    const editor = new AreaEditor(
        document.getElementById("canvas"),
        (areas) => {
            if (!currentArea) return;
            const floor = currentArea.floors.find(f => f.realFloor === parseInt(selectFloors.value));
            if (!floor) return;
            const questId = selectQuests.value;
            if (!questId) return;

            qp.value = '';
            qpp.value = '';

            areas.forEach((area, i) => {
                const iteration = i + 1;


                const scaled = area.points.map(({ x, y }) => ({
                    x: (floor.y2 - floor.y1) * y + floor.y1,
                    y: (floor.x2 - floor.x1) * x + floor.x1
                }));


                qp.value +=
                    qpTemplate
                        .replace(/{{questid}}/g, questId)
                        .replace(/{{iteration}}/g, iteration)
                        .replace(/{{mapid}}/g, currentArea.mapId)
                        .replace(/{{areaid}}/g, currentArea.id)
                        .replace(/{{floor}}/g, floor.realFloor)
                    + '\n';


                if (scaled.length === 0) {

                    return;
                }


                const deleteLine = qppDeleteTpl
                    .replace(/{{questid}}/g, questId)
                    .replace(/{{iteration}}/g, iteration);


                const insertLine = qppInsertTpl;


                const valuesLines = scaled.map((p, idx2) =>
                    `(${questId}, ${iteration}, ${idx2}, ${p.x.toFixed(3)}, ${p.y.toFixed(3)}, 0)`
                ).join(',\n');

                qpp.value +=
                    deleteLine + '\n' +
                    insertLine + '\n' +
                    valuesLines + ';\n\n';
            });
        },
        () => {
            updateAreaSelect();
        }
    );




    clearBtn.addEventListener('click', () => editor.clear());


    addAreaBtn.addEventListener('click', () => {
        editor.addArea();
    });

    areaSelect.addEventListener('change', () => {
        editor.setActiveArea(parseInt(areaSelect.value));
    });


    updateAreaSelect();

}

class AreaEditor {
    constructor(canvas, onUpdate, onAreasChanged) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");


        this.areas = [{ points: [] }];
        this.activeAreaIndex = 0;

        this.draggedPoint = null;
        this.hoveredPoint = null;
        this.onUpdate = onUpdate;
        this.onAreasChanged = typeof onAreasChanged === "function" ? onAreasChanged : () => { };

        this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
        this.resizeObserver.observe(canvas.parentElement);
        this.resizeCanvas();

        this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
        this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
        this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
        this.canvas.addEventListener("click", this.onClick.bind(this));
    }

    get activeArea() {
        return this.areas[this.activeAreaIndex];
    }

    addArea() {
        this.areas.push({ points: [] });
        this.activeAreaIndex = this.areas.length - 1;
        this.onAreasChanged(this.areas);
        this.draw();
        this.triggerUpdate();
    }

    setActiveArea(index) {
        if (index >= 0 && index < this.areas.length) {
            this.activeAreaIndex = index;
            this.draw();
            this.triggerUpdate();
        }
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const newWidth = Math.min(1002, rect.width);
        const newHeight = Math.min(668, rect.height);

        const norm = this.getNormalizedAreas();
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;

        this.areas = norm.map(area => ({
            points: area.points.map(p => ({
                x: p.x * newWidth,
                y: p.y * newHeight
            }))
        }));

        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.areas.forEach((area, i) => {
            const points = area.points;
            if (!points.length) return;

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let j = 1; j < points.length; j++) {
                ctx.lineTo(points[j].x, points[j].y);
            }
            if (points.length > 2) ctx.closePath();

            ctx.fillStyle = i === this.activeAreaIndex ? "rgba(0,170,255,0.3)" : "rgba(0,170,255,0.1)";
            ctx.strokeStyle = i === this.activeAreaIndex ? "#00aaff" : "#888";
            ctx.lineWidth = i === this.activeAreaIndex ? 2 : 1;
            ctx.fill();
            ctx.stroke();

            for (let p of points) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = p === this.hoveredPoint
                    ? "#ffaa00"
                    : (i === this.activeAreaIndex ? "#00aaff" : "#555");
                ctx.fill();
            }
        });
    }

    distance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    getHoveredPoint(mouse) {
        return this.activeArea.points.find((p) => this.distance(p, mouse) < 10) || null;
    }

    onMouseDown(e) {
        const mouse = this.getMousePos(e);
        const point = this.getHoveredPoint(mouse);

        if (e.button === 2 && point) {
            const area = this.activeArea;
            area.points = area.points.filter((p) => p !== point);


            if (area.points.length === 0 && this.areas.length > 1) {
                this.areas.splice(this.activeAreaIndex, 1);
                if (this.activeAreaIndex >= this.areas.length) {
                    this.activeAreaIndex = this.areas.length - 1;
                }
                this.onAreasChanged(this.areas);
            }

            this.draw();
            this.triggerUpdate();
            return;
        }


        if (e.button === 0 && point) {
            this.draggedPoint = point;
        }
    }

    onMouseUp(e) {
        if (e.button === 0) {
            this.draggedPoint = null;
            this.triggerUpdate();
        }
    }

    onMouseMove(e) {
        const mouse = this.getMousePos(e);
        this.hoveredPoint = this.getHoveredPoint(mouse);

        if (this.draggedPoint) {
            this.draggedPoint.x = mouse.x;
            this.draggedPoint.y = mouse.y;
            this.triggerUpdate();
        }

        this.draw();
    }

    onClick(e) {
        if (e.button !== 0) return;
        const mouse = this.getMousePos(e);
        const hovered = this.getHoveredPoint(mouse);
        if (hovered) return;

        const points = this.activeArea.points;

        if (points.length < 2) {
            points.push(mouse);
        } else {
            let minDist = Infinity;
            let insertIndex = 0;

            for (let i = 0; i < points.length; i++) {
                const next = points[(i + 1) % points.length];
                const d = this.pointToSegmentDistance(mouse, points[i], next);
                if (d < minDist) {
                    minDist = d;
                    insertIndex = i + 1;
                }
            }

            points.splice(insertIndex, 0, mouse);
        }

        this.draw();
        this.triggerUpdate();
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
        };
    }

    pointToSegmentDistance(p, v, w) {
        const l2 = this.distance(v, w) ** 2;
        if (l2 === 0) return this.distance(p, v);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
        return this.distance(p, proj);
    }

    clear() {
        this.areas = [{ points: [] }];
        this.activeAreaIndex = 0;
        this.onAreasChanged(this.areas);
        this.draw();
        this.triggerUpdate();
    }


    getNormalizedPoints() {
        const points = this.activeArea.points;
        return points.map((p) => ({
            x: +(p.x / this.canvas.width).toFixed(3),
            y: +(p.y / this.canvas.height).toFixed(3),
        }));
    }


    getNormalizedAreas() {
        return this.areas.map(area => ({
            points: area.points.map(p => ({
                x: +(p.x / this.canvas.width).toFixed(3),
                y: +(p.y / this.canvas.height).toFixed(3),
            }))
        }));
    }

    triggerUpdate() {
        if (typeof this.onUpdate === "function") {
            this.onUpdate(this.getNormalizedAreas());
        }
    }
}




