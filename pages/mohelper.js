export default async function ({ template }) {
    document.title = 'Missing Objectives Helper | WDM Collection';
    return Mustache.render(template, {});
}

export async function after() {
    const response = await getInfo('mohelper', 'getDungeons');
    console.log(response.data);
    
    let fragment = document.createDocumentFragment();
    // {key: value, key: value, ...}
    for (const [key, value] of Object.entries(response.data)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value;
        fragment.appendChild(option);
    }
    

    document.getElementById('dungeons').appendChild(fragment);
    const editor = new AreaEditor('canvas', 'backgroundImage');

    document.getElementById('addPointMode').addEventListener('click', () => {
        editor.setMode('add');
    });

    document.getElementById('deleteMode').addEventListener('click', () => {
        editor.setMode('delete');
    });

    document.getElementById('moveMode').addEventListener('click', () => {
        editor.setMode('move');
    });

    document.getElementById('clearAll').addEventListener('click', () => {
        editor.clearAll();
    });

    editor.setMode('add');
}

class AreaEditor {
    constructor(canvasId, imageId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.image = document.getElementById(imageId);
        this.points = [];
        this.mode = 'add'; // 'add', 'delete', 'move'
        this.selectedPoint = null;
        this.isDragging = false;

        this.init();
    }

    init() {
        this.syncCanvasSize();

        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

        window.addEventListener('resize', () => {
            this.syncCanvasSize();
            this.draw();
        });

        this.image.addEventListener('load', () => {
            this.syncCanvasSize();
            this.draw();
        });

        this.draw();
    }

    syncCanvasSize() {
        this.canvas.width = this.image.offsetWidth;
        this.canvas.height = this.image.offsetHeight;
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.mode === 'add') {
            this.addPoint(x, y);
        } else if (this.mode === 'delete') {
            this.deletePoint(x, y);
        }
    }

    handleMouseDown(event) {
        if (this.mode !== 'move') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.selectedPoint = this.getPointAt(x, y);
        if (this.selectedPoint) {
            this.isDragging = true;
            this.selectedPoint.x = x;
            this.selectedPoint.y = y;
            this.draw();
        }
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.mode === 'delete' || this.mode === 'move') {
            const point = this.getPointAt(x, y);
            this.canvas.style.cursor = point ? 'pointer' : 'crosshair';
        }

        if (this.isDragging && this.selectedPoint) {
            this.selectedPoint.x = x;
            this.selectedPoint.y = y;
            this.draw();
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.selectedPoint = null;
    }

    handleMouseLeave() {
        this.handleMouseUp();
    }

    addPoint(x, y) {
        this.points.push({ x, y });
        this.draw();
    }

    deletePoint(x, y) {
        const pointIndex = this.getPointIndexAt(x, y);
        if (pointIndex !== -1) {
            this.points.splice(pointIndex, 1);
            this.draw();
        }
    }

    getPointAt(x, y, radius = 10) {
        return this.points.find(point => {
            const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
            return distance <= radius;
        });
    }

    getPointIndexAt(x, y, radius = 10) {
        return this.points.findIndex(point => {
            const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
            return distance <= radius;
        });
    }

    clearAll() {
        this.points = [];
        this.draw();
    }

    setMode(mode) {
        this.mode = mode;
        this.updateModeInfo();
    }

    updateModeInfo() {
        const modeInfo = document.getElementById('modeInfo');
        const modes = {
            'add': 'Adding points - click on the image to add a point',
            'delete': 'Deleting points - click on a point to delete it',
            'move': 'Moving points - click and drag a point to move it'
        };
        modeInfo.textContent = `Mode: ${modes[this.mode]}`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.points.length >= 3) {
            this.ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
            this.ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
            this.ctx.lineWidth = 2;

            this.ctx.beginPath();
            this.ctx.moveTo(this.points[0].x, this.points[0].y);

            for (let i = 1; i < this.points.length; i++) {
                this.ctx.lineTo(this.points[i].x, this.points[i].y);
            }

            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }
        if (this.points.length > 0) {
            this.ctx.strokeStyle = '#007bff';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);

            this.ctx.beginPath();
            this.ctx.moveTo(this.points[0].x, this.points[0].y);

            for (let i = 1; i < this.points.length; i++) {
                this.ctx.lineTo(this.points[i].x, this.points[i].y);
            }

            if (this.points.length >= 3) {
                this.ctx.closePath();
            }
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            this.points.forEach((point, index) => {
                this.ctx.fillStyle = '#007bff';
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;

                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(index + 1, point.x, point.y);
            });
        }
    }

    getPoints() {
        return this.points;
    }

    setPoints(newPoints) {
        this.points = newPoints;
        this.draw();
    }
}