// Kelas untuk merepresentasikan Muatan
class Charge {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
    }

    draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, 10, 0, Math.PI * 2);
        context.fillStyle = this.value > 0 ? 'red' : 'blue'; // Warna berbeda untuk muatan positif dan negatif
        context.fill();
        context.stroke();
    }

    isClicked(mouseX, mouseY) {
        return Math.hypot(this.x - mouseX, this.y - mouseY) < 10;
    }

    move(newX, newY) {
        this.x = newX;
        this.y = newY;
    }
}

// Kelas untuk merepresentasikan partikel "pasir" untuk visualisasi medan
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.color = 'black'; // Warna partikel default
    }

    draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, 1, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
    }

    moveToward(targetX, targetY, strength) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 1) {
            this.x += (dx / distance) * strength;
            this.y += (dy / distance) * strength;
        }
    }
}

// Kelas untuk mengelola Simulasi
class Simulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        this.charges = [];
        this.particles = [];
        this.history = [];
        this.redoStack = [];
        this.initParticles(); // Inisialisasi partikel
        this.initEvents();
    }

    initParticles() {
        // Membuat grid partikel di kanvas
        const particleSpacing = 20; // Jarak antar partikel
        for (let y = 0; y < this.canvas.height; y += particleSpacing) {
            for (let x = 0; x < this.canvas.width; x += particleSpacing) {
                this.particles.push(new Particle(x, y));
            }
        }
    }

    addCharge(x, y, value) {
        const charge = new Charge(x, y, value);
        this.charges.push(charge);
        this.updateParticles();
        this.drawAll();
        this.logHistory(`Muatan (${value} C) ditambahkan di (${x.toFixed(1)}, ${y.toFixed(1)})`);
    }

    updateParticles() {
        // Perbarui posisi partikel berdasarkan medan magnet dari muatan
        const strength = 1; // Kekuatan pergerakan partikel
        this.particles.forEach(particle => {
            if (this.charges.length > 0) {
                // Menggunakan muatan pertama sebagai contoh untuk menghitung medan
                const closestCharge = this.charges[0];
                particle.moveToward(closestCharge.x, closestCharge.y, strength);
            }
        });
    }

    drawAll() {
        // Gambar semua elemen di kanvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(particle => particle.draw(this.context));
        this.charges.forEach(charge => charge.draw(this.context));
    }

    logHistory(action) {
        this.history.push(action);
        this.redoStack = [];
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        this.history.forEach((action, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${action}`;
            historyList.appendChild(listItem);
        });
    }

    initEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            let draggedCharge = this.charges.find(charge => charge.isClicked(mouseX, mouseY));

            if (draggedCharge) {
                const onMouseMove = (event) => {
                    const newX = event.clientX - rect.left;
                    const newY = event.clientY - rect.top;
                    draggedCharge.move(newX, newY);
                    this.updateParticles();
                    this.drawAll();
                };

                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    this.logHistory(`Muatan dipindahkan ke (${draggedCharge.x.toFixed(1)}, ${draggedCharge.y.toFixed(1)})`);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }
        });
    }

    resetSimulation() {
        this.charges = [];
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.logHistory('Simulasi direset');
        this.drawAll();
    }

    undo() {
        if (this.history.length > 0) {
            const lastAction = this.history.pop();
            this.redoStack.push(lastAction);
            this.updateHistoryDisplay();
            console.log('Undo:', lastAction);
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const redoAction = this.redoStack.pop();
            this.history.push(redoAction);
            this.updateHistoryDisplay();
            console.log('Redo:', redoAction);
        }
    }
}

// Inisialisasi Simulasi
const simulation = new Simulation('simulationCanvas');

// Tambahkan event untuk tombol kontrol
document.getElementById('resetSimulation').addEventListener('click', () => {
    simulation.resetSimulation();
});

document.getElementById('undoAction').addEventListener('click', () => {
    simulation.undo();
});

document.getElementById('redoAction').addEventListener('click', () => {
    simulation.redo();
});

// Tambahkan muatan baru saat nilai input diubah
document.getElementById('chargeValue').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
        const x = Math.random() * simulation.canvas.width;
        const y = Math.random() * simulation.canvas.height;
        simulation.addCharge(x, y, value);
    }
});

// Tambahkan muatan default saat halaman pertama kali dimuat
simulation.addCharge(simulation.canvas.width / 2, simulation.canvas.height / 2, 1.0);
